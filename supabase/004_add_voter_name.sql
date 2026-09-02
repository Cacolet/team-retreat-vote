-- 自包含升级脚本：无需先执行 003_add_participant_counts.sql。
-- 保留现有投票记录；历史空姓名会标记为“历史匿名投票”，新投票必须填写姓名。

alter table public.trip_votes
  add column if not exists voter_name text,
  add column if not exists voter_key text,
  add column if not exists adult_count integer not null default 1,
  add column if not exists child_count integer not null default 0;

update public.trip_votes
set
  voter_name = case when voter_name is null or char_length(trim(voter_name)) = 0 then '历史匿名投票' else voter_name end,
  adult_count = coalesce(adult_count, 1),
  child_count = coalesce(child_count, 0);

alter table public.trip_votes
  alter column voter_name set not null,
  alter column adult_count set not null,
  alter column child_count set not null;

alter table public.trip_votes
  drop constraint if exists trip_votes_voter_name_check,
  drop constraint if exists trip_votes_adult_count_check,
  drop constraint if exists trip_votes_child_count_check,
  drop constraint if exists trip_votes_total_participants_check,
  drop constraint if exists trip_votes_one_vote_per_date;

alter table public.trip_votes
  add constraint trip_votes_voter_name_check
  check (char_length(trim(voter_name)) between 1 and 30),
  add constraint trip_votes_adult_count_check
  check (adult_count >= 0 and adult_count <= 20),
  add constraint trip_votes_child_count_check
  check (child_count >= 0 and child_count <= 20),
  add constraint trip_votes_total_participants_check
  check (adult_count + child_count >= 1),
  add constraint trip_votes_one_vote_per_date
  unique (trip_id, voter_key, attendance_date);

-- 重新创建匿名写入策略：兼容现有的多日期、成人/儿童人数投票结构。
-- 前端不读取投票明细或数量，管理员仍可通过 Supabase Dashboard 查看。
drop policy if exists "trip_votes_public_read" on public.trip_votes;
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
