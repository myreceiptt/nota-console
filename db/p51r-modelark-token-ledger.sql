-- P5.1R ModelArk free-only text inference: all monetary counters are
-- conservative list-price equivalents, NOT verified provider invoices.
-- Dedicated Preview database only. No transcripts, credentials or prompts.
create table if not exists pilot_private.ark_usage (
 id uuid primary key references pilot_private.reservations(id),
 model text not null check(model='seed-2-0-mini-260428'),
 reserved_tokens integer not null check(reserved_tokens=8192),
 input_tokens integer check(input_tokens between 0 and 7392),
 output_tokens integer check(output_tokens between 0 and 800),
 reasoning_tokens integer check(reasoning_tokens between 0 and output_tokens),
 provider_request_id text check(length(provider_request_id)<=200),
 created_at timestamptz not null default clock_timestamp()
);
alter table pilot_private.ark_usage enable row level security;
revoke all on pilot_private.ark_usage from public,anon,authenticated;
grant select,insert,update on pilot_private.ark_usage to service_role;

create or replace function public.p51r_ark_reserve(p_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare b pilot_private.budget%rowtype; used bigint;
begin
 if p_id is null then return false; end if;
 select * into b from pilot_private.budget where name='p51r' for update;
 if not found or not b.admission_enabled then return false; end if;
 select coalesce(sum(case when input_tokens is null then reserved_tokens else input_tokens+output_tokens end),0)
 into used from pilot_private.ark_usage;
 -- Local 490K cap leaves headroom; provider remains authoritative for shared quota.
 if used+8192>490000 then return false; end if;
 if not pilot_private.reserve_p51r(p_id,3000) then return false; end if;
 insert into pilot_private.ark_usage(id,model,reserved_tokens) values(p_id,'seed-2-0-mini-260428',8192);
 return true;
end $$;
create or replace function public.p51r_ark_settle(p_id uuid,p_input integer,p_output integer,p_reasoning integer,p_provider_id text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare u pilot_private.ark_usage%rowtype; nominal bigint;
begin
 if p_id is null or p_input is null or p_output is null or p_reasoning is null or p_provider_id is null
 or p_input<0 or p_input>7392 or p_output<0 or p_output>800 or p_reasoning<0 or p_reasoning>p_output
 or length(p_provider_id)>200 then return false; end if;
 perform 1 from pilot_private.budget where name='p51r' for update;
 select * into u from pilot_private.ark_usage where id=p_id for update;
 if not found or u.input_tokens is not null then return false; end if;
 -- 0.10 USD/M input and 0.40 USD/M output; ignore cache discount conservatively.
 nominal:=ceil((p_input::numeric+4*p_output::numeric)/10);
 if not pilot_private.settle_p51r(p_id,nominal) then return false; end if;
 update pilot_private.ark_usage set input_tokens=p_input,output_tokens=p_output,reasoning_tokens=p_reasoning,
 provider_request_id=p_provider_id where id=p_id;
 return true;
end $$;
create or replace function public.p51r_ark_status()
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('token_cap',490000,'input_tokens',coalesce(sum(input_tokens),0),
 'output_tokens',coalesce(sum(output_tokens),0),'reasoning_tokens',coalesce(sum(reasoning_tokens),0),
 'reserved_tokens',coalesce(sum(reserved_tokens) filter(where input_tokens is null),0),
 'completed_requests',count(*) filter(where input_tokens is not null))
 from pilot_private.ark_usage
$$;
revoke all on function public.p51r_ark_reserve(uuid),public.p51r_ark_settle(uuid,integer,integer,integer,text),public.p51r_ark_status() from public,anon,authenticated;
grant execute on function public.p51r_ark_reserve(uuid),public.p51r_ark_settle(uuid,integer,integer,integer,text),public.p51r_ark_status() to service_role;
