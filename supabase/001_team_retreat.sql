-- 在 Supabase SQL Editor 中执行一次。
-- 只使用匿名 key 写入，不要把 service role key 放进前端或 GitHub Secrets。

create table if not exists public.trip_votes (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  month integer not null check (month in (8, 9, 10)),
  duration text not null check (duration in ('1day', '2day')),
  voter_key text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, voter_key)
);

create index if not exists trip_votes_trip_id_idx on public.trip_votes (trip_id);
alter table public.trip_votes enable row level security;
drop policy if exists "trip_votes_public_read" on public.trip_votes;
drop policy if exists "trip_votes_public_insert" on public.trip_votes;
create policy "trip_votes_public_read" on public.trip_votes for select to anon, authenticated using (true);
create policy "trip_votes_public_insert" on public.trip_votes for insert to anon, authenticated with check (true);

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

-- 管理员可直接在 Supabase Table Editor 中查看 trip_votes 和 trip_suggestions。
