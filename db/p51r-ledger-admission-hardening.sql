-- Dedicated IMPROMPTU Preview only. No model activation.
alter table pilot_private.budget add column if not exists admission_enabled boolean not null default false;
create index if not exists reservations_created_at_idx on pilot_private.reservations(created_at);
create or replace function pilot_private.reserve_p51r(
  p_id uuid, p_worst_case_microusd bigint
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  b pilot_private.budget%rowtype;
  d pilot_private.daily_budget%rowtype;
  today_utc date;
begin
  if p_id is null or p_worst_case_microusd is null or p_worst_case_microusd <= 0 or p_worst_case_microusd > 1000000 then return false; end if;
  select * into b from pilot_private.budget where name='p51r' for update;
  if not found or not b.admission_enabled then return false; end if;
  -- The global budget row serializes admissions; unresolved reservations block new work.
  if exists (select 1 from pilot_private.reservations where id=p_id or state='reserved') then return false; end if;
  if (select count(*) from pilot_private.reservations where created_at >= clock_timestamp() - interval '1 minute') >= 3 then return false; end if;
  today_utc := (clock_timestamp() at time zone 'UTC')::date;
  insert into pilot_private.daily_budget(spend_day) values(today_utc)
    on conflict(spend_day) do nothing;
  select * into d from pilot_private.daily_budget where spend_day=today_utc for update;
  if (b.spent_total_microusd + b.reserved_total_microusd + p_worst_case_microusd > b.total_cap_microusd)
     or (d.spent_microusd + d.reserved_microusd + p_worst_case_microusd > b.daily_cap_microusd)
     or d.requests >= 20
  then return false; end if;
  insert into pilot_private.reservations(id,reserved_day,reserved_microusd,state,created_at)
    values(p_id,today_utc,p_worst_case_microusd,'reserved',clock_timestamp());
  update pilot_private.budget set reserved_total_microusd=reserved_total_microusd+p_worst_case_microusd
    where name='p51r';
  update pilot_private.daily_budget set reserved_microusd=reserved_microusd+p_worst_case_microusd,
    requests=requests+1 where spend_day=today_utc;
  return true;
end $$;


create or replace function pilot_private.settle_p51r(
  p_id uuid, p_actual_microusd bigint
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  r pilot_private.reservations%rowtype;
begin
  if p_id is null or p_actual_microusd is null then return false; end if;
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
grant execute on function pilot_private.reserve_p51r(uuid,bigint) to service_role;
grant execute on function pilot_private.settle_p51r(uuid,bigint) to service_role;
