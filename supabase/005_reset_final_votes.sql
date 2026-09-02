-- 危险操作：清空 public.trip_votes 的所有历史投票，保留表结构、权限和迁移。
-- 在 Supabase SQL Editor 中确认无须保留历史记录后执行一次。

delete from public.trip_votes;
