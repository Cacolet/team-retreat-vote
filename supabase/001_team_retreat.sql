-- 在 Supabase SQL Editor 中执行一次。只使用匿名 key 写入；不要把 service role key 放进前端。

create table if not exists public.trip_votes (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  month integer not null check (month in (8, 9, 10)),
  duration text not null check (duration in ('1day', '2day')),
  voter_name text not null check (char_length(trim(voter_name)) between 1 and 30),
  weekend_start date not null,
  weekend_end date not null,
  attendance_date date not null,
  voter_key text,
  created_at timestamptz not null default now(),
  constraint trip_votes_weekend_range check (weekend_end = weekend_start + 1),
  constraint trip_votes_one_vote_per_date unique (trip_id, voter_name, attendance_date)
);

-- 为已有的早期匿名投票表补齐字段后再切换到新版投票规则。
alter table public.trip_votes add column if not exists voter_name text;
alter table public.trip_votes add column if not exists weekend_start date;
alter table public.trip_votes add column if not exists weekend_end date;
alter table public.trip_votes add column if not exists attendance_date date;
alter table public.trip_votes drop constraint if exists trip_votes_trip_id_voter_key_key;
alter table public.trip_votes drop constraint if exists trip_votes_one_vote_per_weekend;
alter table public.trip_votes drop constraint if exists trip_votes_one_vote_per_date;
alter table public.trip_votes add constraint trip_votes_one_vote_per_date unique (trip_id, voter_name, attendance_date);
create index if not exists trip_votes_trip_id_idx on public.trip_votes (trip_id);
create index if not exists trip_votes_schedule_idx on public.trip_votes (month, weekend_start);

alter table public.trip_votes enable row level security;
drop policy if exists "trip_votes_public_read" on public.trip_votes;
drop policy if exists "trip_votes_public_insert" on public.trip_votes;
create policy "trip_votes_public_read" on public.trip_votes for select to anon, authenticated using (true);
create policy "trip_votes_public_insert" on public.trip_votes for insert to anon, authenticated with check (
  char_length(trim(voter_name)) between 1 and 30
  and weekend_end = weekend_start + 1
  and extract(month from weekend_start) = month
  and attendance_date between weekend_start and weekend_end
);

create table if not exists public.trip_suggestions (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month in (8, 9, 10)),
  duration text not null check (duration in ('1day', '2day')),
  itinerary text not null,
  created_at timestamptz not null default now()
);

alter table public.trip_suggestions enable row level security;
drop policy if exists "trip_suggestions_public_insert" on public.trip_suggestions;
create policy "trip_suggestions_public_insert" on public.trip_suggestions for insert to anon, authenticated with check (char_length(trim(itinerary)) > 0);

-- 管理员可在 Table Editor 按 month、weekend_start 查看每个周末的参与意向。
