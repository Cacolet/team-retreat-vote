# 成都近郊员工团建共创站

独立的 Vite + React 投票站，适合直接通过 GitHub Pages 部署。方案内容来自《成都近郊员工团建方案_2026年8-10月》，支持：

- 8 / 9 / 10 月筛选
- 1 天、2 天 1 夜切换
- 候选行程列表与右侧滑入详情预览
- 姓名、候选方案与可参加周末的必填投票
- 只展示 Supabase 中的真实票数，不混入模拟数据
- 选择月份后，自动列出从当天起该月份内可参加的完整周末
- 右下角浮动「提想法」弹框，收集月份、天数和行程规划

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

## 开启数据库投票

1. 首次部署时，在已连接的 Supabase 项目 SQL Editor 执行 `supabase/001_team_retreat.sql`。
2. 如果此前已经执行过 `001_team_retreat.sql`，再执行 `supabase/002_add_attendance_date.sql`，以支持 1 天方案单独选择周六或周日。
3. 重新加载本地页面；状态会显示「实时同步投票」，票数将从 `trip_votes` 读取。
4. 在 Table Editor 按 `month`、`weekend_start`、`attendance_date` 查看各个日期的报名意向。
5. 不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端或 GitHub Secrets；这个项目只需要 anon key。

工作区根目录已有 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 时，本项目本地开发会自动复用这两项公开配置；独立部署时使用上面的 `VITE_*` 配置即可。

## 是否需要后端服务？

不需要额外自建 Node / Java 后端。Supabase 提供数据库、行级安全策略和公开 API，浏览器可以用 anon key 直接提交受 RLS 约束的投票。只有需要管理员审核、企业登录、导出隐私数据或更严格的反刷票时，才建议增加服务端接口或 Edge Function。

## GitHub Pages 自动部署

1. 将 `team-retreat-vote` 目录作为一个新的 GitHub 仓库根目录。
2. 在仓库 Settings → Secrets and variables → Actions 中新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 在 Settings → Pages → Build and deployment 中选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布。

如果仓库使用自定义域名，需把 workflow 里的 `VITE_BASE_PATH` 改成 `/`。
