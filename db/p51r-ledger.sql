-- P5.1R dedicated Supabase project only. Migration REVIEW ONLY.
-- Never apply to Transient Contract Manager, Alpha Radar or another project.
-- Deny anonymous and authenticated Data API access. Service role only.
create schema if not exists pilot_private;

create table if not exists pilot_private.budget (
  name text primary key check (name = 'p51r'),
  total_cap_microusd bigint not null default 5000000 check (total_cap_microusd between 0 and 5000000),
  daily_cap_microusd bigint not null default 1000000 check (daily_cap_microusd between 0 and 1000000),
  reserved_total_microusd bigint not null default 0 check (reserved_total_microusd >= 0),
  spent_total_microusd bigint not null default 0 check (spent_total_microusd >= 0)
);
create table if not exists pilot_private.daily_budget (
  spend_day date primary key,
  reserved_microusd bigint not null default 0 check (reserved_microusd >= 0),
  spent_microusd bigint not null default 0 check (spent_microusd >= 0),
  requests integer not null default 0 check (requests >= 0)
);
create table if not exists pilot_private.reservations (
  id uuid primary key,
  reserved_day date not null references pilot_private.daily_budget(spend_day),
  reserved_microusd bigint not null check (reserved_microusd > 0),
  spent_microusd bigint,
  state text not null check (state in ('reserved','settled')),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  constraint settled_amount_valid check (spent_microusd is null or
    (spent_microusd >= 0 and spent_microusd <= reserved_microusd))
);
create index if not exists reservations_day_idx on pilot_private.reservations(reserved_day);

alter table pilot_private.budget enable row level security;
alter table pilot_private.daily_budget enable row level security;
alter table pilot_private.reservations enable row level security;
revoke all on schema pilot_private from public, anon, authenticated;
revoke all on all tables in schema pilot_private from public, anon, authenticated;
insert into pilot_private.budget(name) values('p51r') on conflict(name) do nothing;

-- A reservation pessimistically consumes the full maximum amount, even if
-- a worker crashes. An unresolved reservation stays charged until reconciled;
-- no expiration automatically releases funds.
create or replace function pilot_private.reserve_p51r(
  p_id uuid, p_worst_case_microusd bigint
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  b pilot_private.budget%rowtype;
  d pilot_private.daily_budget%rowtype;
  today_utc date := (now() at time zone 'UTC')::date;
begin
  if p_worst_case_microusd <= 0 or p_worst_case_microusd > 1000000 then return false; end if;
  select * into b from pilot_private.budget where name='p51r' for update;
  if not found then return false; end if;
  insert into pilot_private.daily_budget(spend_day) values(today_utc)
    on conflict(spend_day) do nothing;
  select * into d from pilot_private.daily_budget where spend_day=today_utc for update;
  if (b.spent_total_microusd + b.reserved_total_microusd + p_worst_case_microusd > b.total_cap_microusd)
     or (d.spent_microusd + d.reserved_microusd + p_worst_case_microusd > b.daily_cap_microusd)
     or d.requests >= 20
  then return false; end if;
  insert into pilot_private.reservations(id,reserved_day,reserved_microusd,state)
    values(p_id,today_utc,p_worst_case_microusd,'reserved');
  update pilot_private.budget set reserved_total_microusd=reserved_total_microusd+p_worst_case_microusd
    where name='p51r';
  update pilot_private.daily_budget set reserved_microusd=reserved_microusd+p_worst_case_microusd,
    requests=requests+1 where spend_day=today_utc;
  return true;
end $$;

-- Settlement requires provider-side verified billable usage, not client input.
-- Idempotent: a repeated settlement returns false and never charges twice.
create or replace function pilot_private.settle_p51r(
  p_id uuid, p_actual_microusd bigint
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  r pilot_private.reservations%rowtype;
begin
  -- Match reservation ordering to avoid deadlock: lock budget then reservation.
  perform 1 from pilot_private.budget where name='p51r' for update;
  select * into r from pilot_private.reservations where id=p_id for update;
  if not found or r.state <> 'reserved' then return false; end if;
  if p_actual_microusd < 0 or p_actual_microusd > r.reserved_microusd then return false; end if;
  update pilot_private.reservations set state='settled',
    spent_microusd=p_actual_microusd, settled_at=now() where id=p_id;
  update pilot_private.budget set
    reserved_total_microusd=reserved_total_microusd-r.reserved_microusd,
    spent_total_microusd=spent_total_microusd+p_actual_microusd where name='p51r';
  update pilot_private.daily_budget set
    reserved_microusd=reserved_microusd-r.reserved_microusd,
    spent_microusd=spent_microusd+p_actual_microusd where spend_day=r.reserved_day;
  return true;
end $$;

revoke all on function pilot_private.reserve_p51r(uuid,bigint) from public,anon,authenticated;
revoke all on function pilot_private.settle_p51r(uuid,bigint) from public,anon,authenticated;
-- Grant only to backend service role. No browser access to these functions.
grant usage on schema pilot_private to service_role;
grant select,insert,update on all tables in schema pilot_private to service_role;
grant execute on function pilot_private.reserve_p51r(uuid,bigint) to service_role;
grant execute on function pilot_private.settle_p51r(uuid,bigint) to service_role;

-- PostgREST only exposes the default public schema. These thin wrappers are
-- explicitly service-role-only. They are SECURITY INVOKER and keep all data
-- in the non-exposed pilot_private schema.
create or replace function public.p51r_reserve(
  p_id uuid, p_worst_case_microusd bigint
) returns boolean language sql security invoker set search_path = ''
as $$ select pilot_private.reserve_p51r(p_id, p_worst_case_microusd); $$;
create or replace function public.p51r_settle(
  p_id uuid, p_actual_microusd bigint
) returns boolean language sql security invoker set search_path = ''
as $$ select pilot_private.settle_p51r(p_id, p_actual_microusd); $$;
revoke all on function public.p51r_reserve(uuid,bigint) from public,anon,authenticated;
revoke all on function public.p51r_settle(uuid,bigint) from public,anon,authenticated;
grant execute on function public.p51r_reserve(uuid,bigint) to service_role;
grant execute on function public.p51r_settle(uuid,bigint) to service_role;
