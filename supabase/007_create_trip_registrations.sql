-- 在 Supabase SQL Editor 中执行。最终人数登记独立存储，不影响历史意向投票。
begin;

create table if not exists public.trip_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  destination text not null,
  departure_date date not null,
  return_date date not null,
  participant_name text not null check (char_length(trim(participant_name)) between 1 and 30),
  adult_count integer not null default 1 check (adult_count between 1 and 20),
  child_count integer not null default 0 check (child_count between 0 and 20),
  registrant_key text not null,
  created_at timestamptz not null default now(),
  constraint trip_registrations_event_device_unique unique (event_id, registrant_key),
  constraint trip_registrations_date_range check (return_date = departure_date + 1)
);

alter table public.trip_registrations enable row level security;
grant insert on public.trip_registrations to anon, authenticated;
revoke select, update, delete on public.trip_registrations from anon, authenticated;

drop policy if exists trip_registrations_public_insert on public.trip_registrations;
create policy trip_registrations_public_insert
on public.trip_registrations for insert to anon, authenticated
with check (
  event_id = 'xiling-2026-10-17'
  and destination = '西岭雪山'
  and departure_date = date '2026-10-17'
  and return_date = date '2026-10-18'
  and char_length(trim(participant_name)) between 1 and 30
  and adult_count between 1 and 20
  and child_count between 0 and 20
  and char_length(registrant_key) between 1 and 100
);

commit;

-- 管理员汇总（在 Dashboard/SQL Editor 查看，不对前端开放）：
-- select count(*) as registrations, coalesce(sum(adult_count), 0) as adults,
--        coalesce(sum(child_count), 0) as children,
--        coalesce(sum(adult_count + child_count), 0) as total
-- from public.trip_registrations where event_id = 'xiling-2026-10-17';
