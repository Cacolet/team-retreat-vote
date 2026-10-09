-- 先执行 007、008；本脚本新增独立统计页使用的管理员口令和只读函数。
-- 执行前修改下方 admin_password 的赋值，口令为 1–256 位非空字符。
-- 口令只保存盐值和哈希，不写入前端。再次执行本脚本会更新管理员口令。
begin;

create table if not exists public.retreat_stats_access (
  event_id text primary key,
  password_salt text not null,
  password_hash bytea not null
);
alter table public.retreat_stats_access enable row level security;
revoke all on public.retreat_stats_access from public, anon, authenticated;

do $$
declare
  admin_password text := 'REPLACE_WITH_YOUR_ADMIN_PASSWORD';
  salt text := gen_random_uuid()::text;
begin
  admin_password := trim(admin_password);
  if admin_password like 'REPLACE_%' or char_length(admin_password) not between 1 and 256 then
    raise exception 'Replace the admin password placeholder with a password of 1 to 256 characters';
  end if;
  insert into public.retreat_stats_access(event_id, password_salt, password_hash)
  values ('xiling-2026-10-17', salt, pg_catalog.sha256(pg_catalog.convert_to(salt || admin_password, 'UTF8')))
  on conflict (event_id) do update set password_salt = excluded.password_salt, password_hash = excluded.password_hash;
end;
$$;

create or replace function public.get_retreat_registration_stats(p_admin_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if p_admin_password is null or char_length(p_admin_password) not between 1 and 256
     or not exists (
       select 1 from public.retreat_stats_access a
       where a.event_id = 'xiling-2026-10-17'
       and a.password_hash = pg_catalog.sha256(pg_catalog.convert_to(a.password_salt || p_admin_password, 'UTF8'))
     ) then
    raise exception 'Invalid admin password' using errcode = '42501';
  end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', r.id,
    'participant_name', r.participant_name,
    'adult_count', r.adult_count,
    'child_count', r.child_count,
    'transport_mode', r.transport_mode,
    'created_at', r.created_at,
    'updated_at', r.updated_at
  ) order by coalesce(r.updated_at, r.created_at) desc, r.id), '[]'::jsonb) into result
  from public.trip_registrations r
  where r.event_id = 'xiling-2026-10-17';
  return result;
end;
$$;

revoke all on function public.get_retreat_registration_stats(text) from public;
grant execute on function public.get_retreat_registration_stats(text) to anon, authenticated;

commit;
