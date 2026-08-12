-- 已执行 001_team_retreat.sql 的项目，执行此迁移以支持 1 天方案选择周六或周日。

alter table public.trip_votes add column if not exists attendance_date date;

-- 保留既有投票；旧记录默认对应其周六日期。
update public.trip_votes
set attendance_date = weekend_start
where attendance_date is null;

alter table public.trip_votes alter column attendance_date set not null;
alter table public.trip_votes drop constraint if exists trip_votes_one_vote_per_weekend;
alter table public.trip_votes drop constraint if exists trip_votes_one_vote_per_date;
alter table public.trip_votes add constraint trip_votes_one_vote_per_date unique (trip_id, voter_name, attendance_date);

drop policy if exists "trip_votes_public_insert" on public.trip_votes;
create policy "trip_votes_public_insert" on public.trip_votes for insert to anon, authenticated with check (
  char_length(trim(voter_name)) between 1 and 30
  and weekend_end = weekend_start + 1
  and extract(month from weekend_start) = month
  and attendance_date between weekend_start and weekend_end
);
