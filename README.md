# 成都近郊员工团建共创站

独立的 Vite + React 静态站，适合直接通过 GitHub Pages 部署。方案内容来自《成都近郊员工团建方案_2026年8-10月》，支持：

- 8 / 9 / 10 月筛选
- 1 天、2 天 1 夜切换
- 候选行程列表与右侧滑入详情预览
- Supabase 投票、票数展示、匿名设备去重
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

1. 在 Supabase SQL Editor 执行 `supabase/001_team_retreat.sql`。
2. 在 Supabase Table Editor 查看 `trip_votes` 和 `trip_suggestions`。
3. 不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端或 GitHub Secrets；这个项目只需要 anon key。

## GitHub Pages 自动部署

1. 将 `team-retreat-vote` 目录作为一个新的 GitHub 仓库根目录。
2. 在仓库 Settings → Secrets and variables → Actions 中新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 在 Settings → Pages → Build and deployment 中选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布。

如果仓库使用自定义域名，需把 workflow 里的 `VITE_BASE_PATH` 改成 `/`。
