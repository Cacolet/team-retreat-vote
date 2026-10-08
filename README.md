# 西岭雪山团建报名

独立的 Vite + React 人数登记站，通过 Supabase 保存报名并通过 GitHub Pages 部署。本次活动固定为西岭雪山，2026 年 10 月 17–18 日（两天一夜）。

- 必填姓名，不在浏览器持久保存
- 大人（含本人）至少 1 人、小孩至少 0 人
- 页面仅展示本次填写人数和成功反馈，不读取报名名单或总人数
- 本次确认报名独立存储在 `trip_registrations`；历史 `trip_votes` 不计入本次人数
- 每个浏览器匿名标识在同一活动中只能登记一次；更换浏览器或清除存储可绕过此限制，管理员仍需按姓名核对重复报名

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` 只需要放 Supabase 的公开 URL 和 anon key：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 开启数据库登记

1. 在 Supabase 项目 SQL Editor 执行 `supabase/007_create_trip_registrations.sql`。该脚本无需执行旧的投票迁移，且不会清空任何历史投票。
2. 配好公开 URL 和 anon key 后即可提交真实报名。
3. 管理员在 Table Editor 的 `trip_registrations` 查看姓名与成人、儿童人数；SQL 脚本末尾提供人数汇总查询。
4. 新表启用 RLS，只允许公众写入本次活动报名，公众无权读取、修改或删除报名。
5. 不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端；这个项目只需要 anon key。

工作区根目录已有 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 时，本项目本地开发会自动复用这两项公开配置；独立部署时使用上面的 `VITE_*` 配置即可。

## 是否需要后端服务？

不需要额外自建 Node / Java 后端。Supabase 提供数据库、行级安全策略和公开 API，浏览器可以用 anon key 直接提交受 RLS 约束的报名。

## GitHub Pages 自动部署

1. 将 `team-retreat-vote` 目录作为一个新的 GitHub 仓库根目录。
2. 在仓库 Settings → Secrets and variables → Actions 中新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 在 Settings → Pages → Build and deployment 中选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布。

如果仓库使用自定义域名，需把 workflow 里的 `VITE_BASE_PATH` 改成 `/`。
