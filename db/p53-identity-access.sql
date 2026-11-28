-- P5.3: additive member identity and request attribution, dedicated Preview only.
-- No access/refresh tokens or chat content are stored. All RPCs service-role only.
create table pilot_private.user_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null check(length(email)<=254),
 role text not null check(role in ('owner','member')),
 status text not null default 'active' check(status in ('active','blocked')),
 created_at timestamptz not null default now()
);
create table pilot_private.user_sessions (
 session_id uuid primary key,
 user_id uuid not null references pilot_private.user_profiles(user_id) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days'),
 revoked_at timestamptz
);
alter table pilot_private.user_profiles enable row level security;
alter table pilot_private.user_sessions enable row level security;
revoke all on pilot_private.user_profiles,pilot_private.user_sessions from public,anon,authenticated;
grant select,insert,update on pilot_private.user_profiles,pilot_private.user_sessions to service_role;
alter table pilot_private.ark_usage add column user_id uuid references pilot_private.user_profiles(user_id) on delete set null;
create index p53_usage_user_time on pilot_private.ark_usage(user_id,created_at);
create index p53_sessions_user on pilot_private.user_sessions(user_id);
create function public.p53_session(p_uid uuid,p_sid uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('user_id',p.user_id,'email',p.email,'role',p.role,'expires_at',s.expires_at)
 from pilot_private.user_profiles p join pilot_private.user_sessions s using(user_id)
 where p.user_id=p_uid and s.session_id=p_sid and p.status='active'
 and s.revoked_at is null and s.expires_at>now()
$$;
create function public.p53_register(p_uid uuid,p_sid uuid,p_email text,p_role text) returns jsonb
language plpgsql set search_path='' as $$
begin
 if p_uid is null or p_sid is null or p_email is null or length(p_email)>254 or p_role not in ('owner','member') then return null; end if;
 insert into pilot_private.user_profiles(user_id,email,role) values(p_uid,p_email,p_role)
 on conflict(user_id) do update set email=excluded.email,role=excluded.role
 where pilot_private.user_profiles.status='active';
 if not exists(select 1 from pilot_private.user_profiles where user_id=p_uid and status='active') then return null; end if;
 insert into pilot_private.user_sessions(session_id,user_id) values(p_sid,p_uid) on conflict(session_id) do nothing;
 return public.p53_session(p_uid,p_sid);
end $$;
create function public.p53_revoke(p_uid uuid,p_sid uuid) returns boolean
language plpgsql set search_path='' as $$
begin
 update pilot_private.user_sessions set revoked_at=now() where user_id=p_uid and session_id=p_sid and revoked_at is null;
 return true;
end $$;
create function public.p53_reserve(p_id uuid,p_uid uuid,p_sid uuid) returns boolean
language plpgsql set search_path='' as $$
declare v_role text; v_count bigint;
begin
 -- Same global lock as P5.1R; atomically apply both user and global limits.
 perform 1 from pilot_private.budget where name='p51r' for update;
 select p.role into v_role from pilot_private.user_profiles p join pilot_private.user_sessions s using(user_id)
 where p.user_id=p_uid and s.session_id=p_sid and p.status='active' and s.revoked_at is null and s.expires_at>now()
 for update of p,s;
 if not found then return false; end if;
 select count(*) into v_count from pilot_private.ark_usage where user_id=p_uid and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if v_role='member' and v_count>=3 then return false; end if;
 if not public.p51r_ark_reserve(p_id) then return false; end if;
 update pilot_private.ark_usage set user_id=p_uid where id=p_id;
 return true;
end $$;
create function public.p53_usage(p_uid uuid) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('input_tokens',coalesce(sum(input_tokens),0),'output_tokens',coalesce(sum(output_tokens),0),
 'reasoning_tokens',coalesce(sum(reasoning_tokens),0),'reserved_tokens',coalesce(sum(reserved_tokens) filter(where input_tokens is null),0),
 'completed_requests',count(*) filter(where input_tokens is not null),
 'daily_requests',count(*) filter(where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'))
 from pilot_private.ark_usage where user_id=p_uid
$$;
create function public.p53_members() returns jsonb
language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (
 select user_id,email,status,created_at,public.p53_usage(user_id) as usage from pilot_private.user_profiles
 where role='member' order by created_at desc limit 100) t
$$;
create function public.p53_member_status(p_uid uuid,p_status text) returns boolean
language plpgsql set search_path='' as $$
begin
 if p_status not in ('active','blocked') then return false; end if;
 perform 1 from pilot_private.budget where name='p51r' for update;
 update pilot_private.user_profiles set status=p_status where user_id=p_uid and role='member';
 if not found then return false; end if;
 if p_status='blocked' then update pilot_private.user_sessions set revoked_at=now() where user_id=p_uid and revoked_at is null; end if;
 return true;
end $$;
create function public.p53_admission(p_enabled boolean) returns boolean
language plpgsql set search_path='' as $$
begin
 if p_enabled is null then return false; end if;
 update pilot_private.budget set admission_enabled=p_enabled where name='p51r';
 return found;
end $$;
revoke execute on function public.p53_session(uuid,uuid),public.p53_register(uuid,uuid,text,text),public.p53_revoke(uuid,uuid),public.p53_reserve(uuid,uuid,uuid),public.p53_usage(uuid),public.p53_members(),public.p53_member_status(uuid,text),public.p53_admission(boolean) from public,anon,authenticated;
grant execute on function public.p53_session(uuid,uuid),public.p53_register(uuid,uuid,text,text),public.p53_revoke(uuid,uuid),public.p53_reserve(uuid,uuid,uuid),public.p53_usage(uuid),public.p53_members(),public.p53_member_status(uuid,text),public.p53_admission(boolean) to service_role;
