-- Read-only, server-role-only budget connectivity proof. No admission or settlement.
create or replace function public.p51r_status()
returns jsonb language sql stable security invoker set search_path=''
as $$
select jsonb_build_object(
  'admission_enabled', admission_enabled,
  'total_cap_microusd', total_cap_microusd,
  'daily_cap_microusd', daily_cap_microusd,
  'spent_total_microusd', spent_total_microusd,
  'reserved_total_microusd', reserved_total_microusd)
from pilot_private.budget where name='p51r'
$$;
revoke all on function public.p51r_status() from public,anon,authenticated;
grant execute on function public.p51r_status() to service_role;
