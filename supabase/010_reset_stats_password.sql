-- 仅重置统计页口令，不修改报名数据。需已执行 009_registration_stats.sql。
-- 只修改下面 new_password 的赋值，口令使用 1–256 位非空字符；然后执行整个脚本。
-- 会同步更新统计函数长度校验，因此支持已安装旧版 12 位限制的项目。
-- 脚本会在保存后立即调用现有统计函数校验；验证失败时事务回滚。
begin;

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
    'id', r.id, 'participant_name', r.participant_name,
    'adult_count', r.adult_count, 'child_count', r.child_count,
    'transport_mode', r.transport_mode,
    'created_at', r.created_at, 'updated_at', r.updated_at
  ) order by coalesce(r.updated_at, r.created_at) desc, r.id), '[]'::jsonb) into result
  from public.trip_registrations r
  where r.event_id = 'xiling-2026-10-17';
  return result;
end;
$$;

revoke all on function public.get_retreat_registration_stats(text) from public;
grant execute on function public.get_retreat_registration_stats(text) to anon, authenticated;

do $$
declare
  new_password text := 'REPLACE_WITH_YOUR_NEW_PASSWORD';
  salt text := gen_random_uuid()::text;
begin
  new_password := trim(new_password);
  if new_password like 'REPLACE_%' or char_length(new_password) not between 1 and 256 then
    raise exception 'Set new_password to a password of 1 to 256 characters';
  end if;

  insert into public.retreat_stats_access(event_id, password_salt, password_hash)
  values ('xiling-2026-10-17', salt, pg_catalog.sha256(pg_catalog.convert_to(salt || new_password, 'UTF8')))
  on conflict (event_id) do update set password_salt = excluded.password_salt, password_hash = excluded.password_hash;

  -- 验证新口令确实能通过当前数据库中的统计函数，不把姓名名单输出到结果。
  perform public.get_retreat_registration_stats(new_password);
end;
$$;

commit;

select '管理员口令已重置，并通过统计接口校验' as result;
