-- 可选日期优先级：保留已有投票，并为历史记录默认设置为非优先。
alter table public.trip_votes
  add column if not exists is_priority boolean not null default false;

update public.trip_votes
set is_priority = false
where is_priority is null;

alter table public.trip_votes
  alter column is_priority set not null,
  alter column is_priority set default false;
