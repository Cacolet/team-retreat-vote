-- 在已执行 007_create_trip_registrations.sql 的项目中执行。
-- 历史报名出行方式为空（待确认）；同一浏览器的再次提交更新原报名，不增加记录数。
begin;

alter table public.trip_registrations
  add column if not exists transport_mode text,
  add column if not exists updated_at timestamptz;

alter table public.trip_registrations
  drop constraint if exists trip_registrations_transport_mode_check;
alter table public.trip_registrations
  add constraint trip_registrations_transport_mode_check
  check (transport_mode in ('bus', 'self_drive'));

-- 匿名标识是本浏览器持有的随机 UUID。函数只读取该标识对应的本次报名。
-- 不开放整表读取或修改权限，也不在前端持久保存姓名。
create or replace function public.get_retreat_registration(p_registrant_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration jsonb;
begin
  if p_registrant_key is null or p_registrant_key !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'Invalid registration key' using errcode = '22023';
  end if;

  select pg_catalog.jsonb_build_object(
    'participant_name', r.participant_name,
    'adult_count', r.adult_count,
    'child_count', r.child_count,
    'transport_mode', r.transport_mode
  ) into registration
  from public.trip_registrations r
  where r.event_id = 'xiling-2026-10-17' and r.registrant_key = p_registrant_key;

  return registration;
end;
$$;

create or replace function public.save_retreat_registration(
  p_registrant_key text,
  p_participant_name text,
  p_adult_count integer,
  p_child_count integer,
  p_transport_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_registrant_key is null or p_registrant_key !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
     or p_participant_name is null or char_length(trim(p_participant_name)) not between 1 and 30
     or p_adult_count is null or p_adult_count not between 1 and 20
     or p_child_count is null or p_child_count not between 0 and 20
     or p_transport_mode is null or p_transport_mode not in ('bus', 'self_drive') then
    raise exception 'Invalid registration details' using errcode = '22023';
  end if;

  insert into public.trip_registrations (
    event_id, destination, departure_date, return_date,
    participant_name, adult_count, child_count, transport_mode, registrant_key, updated_at
  ) values (
    'xiling-2026-10-17', '西岭雪山', date '2026-10-17', date '2026-10-18',
    trim(p_participant_name), p_adult_count, p_child_count, p_transport_mode, p_registrant_key, now()
  )
  on conflict (event_id, registrant_key) do update set
    participant_name = excluded.participant_name,
    adult_count = excluded.adult_count,
    child_count = excluded.child_count,
    transport_mode = excluded.transport_mode,
    updated_at = excluded.updated_at;
end;
$$;

-- 报名入口统一走函数，避免绕过校验、漏填出行方式。
alter table public.trip_registrations enable row level security;
drop policy if exists trip_registrations_public_insert on public.trip_registrations;
revoke select, insert, update, delete on public.trip_registrations from anon, authenticated;

revoke all on function public.get_retreat_registration(text) from public;
revoke all on function public.save_retreat_registration(text, text, integer, integer, text) from public;
grant execute on function public.get_retreat_registration(text) to anon, authenticated;
grant execute on function public.save_retreat_registration(text, text, integer, integer, text) to anon, authenticated;

commit;

-- 管理员出行人数汇总（空值单独统计为待确认，不能默认视为大巴）：
-- select coalesce(transport_mode, 'pending') as transport_mode,
--        count(*) as registrations, sum(adult_count) as adults,
--        sum(child_count) as children, sum(adult_count + child_count) as total
-- from public.trip_registrations where event_id = 'xiling-2026-10-17'
-- group by transport_mode;
