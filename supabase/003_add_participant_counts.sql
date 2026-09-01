-- 最终敲定阶段：投票记录同行人数；一个人可为同一方案勾选多个日期，但同一日期只能提交一次。
alter table public.trip_votes
  add column if not exists adult_count integer not null default 1,
  add column if not exists child_count integer not null default 0;

alter table public.trip_votes
  drop constraint if exists trip_votes_adult_count_check,
  drop constraint if exists trip_votes_child_count_check,
  drop constraint if exists trip_votes_total_participants_check,
  drop constraint if exists trip_votes_one_vote_per_date;

alter table public.trip_votes
  add constraint trip_votes_adult_count_check check (adult_count >= 0 and adult_count <= 20),
  add constraint trip_votes_child_count_check check (child_count >= 0 and child_count <= 20),
  add constraint trip_votes_total_participants_check check (adult_count + child_count >= 1),
  add constraint trip_votes_one_vote_per_date unique (trip_id, voter_key, attendance_date);

drop policy if exists "trip_votes_public_insert" on public.trip_votes;
create policy "trip_votes_public_insert" on public.trip_votes for insert to anon, authenticated with check (
  char_length(trim(voter_name)) between 1 and 30
  and month between 1 and 12
  and duration in ('1day', '2day')
  and weekend_end = weekend_start + 1
  and extract(month from weekend_start) = month
  and attendance_date between weekend_start and weekend_end
  and adult_count >= 0
  and child_count >= 0
  and adult_count + child_count >= 1
);
