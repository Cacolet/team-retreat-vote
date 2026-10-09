# 西岭雪山团建报名

独立的 Vite + React 人数登记站，通过 Supabase 保存报名并通过 GitHub Pages 部署。本次活动固定为西岭雪山，2026 年 10 月 17–18 日（两天一夜）。

- 必填姓名，不在浏览器持久保存
- 大人（含本人）至少 1 人、小孩至少 0 人
- 出行方式必填：乘坐大巴 / 自行开车，适用于本次登记的所有同行家人
- 页面仅展示本浏览器的报名与成功反馈，不读取报名名单或总人数
- 本次确认报名独立存储在 `trip_registrations`；历史 `trip_votes` 不计入本次人数
- 同一浏览器再次提交会更新原报名，人数不会重复累加；可从成功页修改或再次打开网站补充出行方式
- 姓名不保存在浏览器存储中；随机浏览器标识用于读取和更新本人记录。更换浏览器或清除存储无法关联原报名，管理员需协助核对

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
2. 再执行 `supabase/008_registration_transport_updates.sql`，支持出行方式和再次保存。新部署按 007、008 顺序执行；已有 007 的项目只执行 008。
3. 管理员在 Table Editor 的 `trip_registrations` 查看姓名与成人、儿童人数；SQL 脚本末尾提供人数汇总查询。
4. 新表启用 RLS，禁止公众直接读写整表。报名通过两个受限函数读取和更新随机浏览器标识对应的本次记录。
5. 不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端；这个项目只需要 anon key。

工作区根目录已有 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 时，本项目本地开发会自动复用这两项公开配置；独立部署时使用上面的 `VITE_*` 配置即可。

## 是否需要后端服务？

不需要额外自建 Node / Java 后端。Supabase 提供数据库和公开 API；两个数据库函数固定活动并校验姓名、人数、出行方式，使用随机浏览器标识关联原报名。

已有记录的 `transport_mode` 为 NULL，表示出行方式待确认。管理员可运行 008 脚本末尾的汇总查询分别统计大巴、自驾和待确认人数；自驾报名份数不等于车辆数。

## 独立数据统计页

通过 `/#/registrations` 直接访问，报名页面没有入口。本地地址是 `http://127.0.0.1:5173/#/registrations`；GitHub Pages 地址为站点部署地址后追加 `#/registrations`。Hash 路由支持直接访问和刷新。

执行 `supabase/009_registration_stats.sql` 前，将脚本中的管理员口令变量 `REPLACE_WITH_YOUR_ADMIN_PASSWORD` 替换为你设置的非空口令（1–256 位）。执行后即可输入该口令查看总人数、大巴、自驾、待确认人数和姓名明细。脚本保留原报名数据，不开放整表匿名查询。管理员口令及统计数据不写入浏览器存储；刷新或锁定页面后需重新验证。

再次执行 009 并设置新口令可更换访问口令。统计页按报名记录汇总，跨浏览器重复报名仍需要管理员按姓名核对。

若忘记口令或设置后仍无法登录，修改 `supabase/010_reset_stats_password.sql` 中 `new_password` 的赋值，并在页面配置的同一 Supabase 项目执行完整脚本。脚本会移除旧的 12 位最低长度限制、重置口令并调用统计函数验证；验证通过才提交，且不改动报名记录。

## GitHub Pages 自动部署

1. 将 `team-retreat-vote` 目录作为一个新的 GitHub 仓库根目录。
2. 在仓库 Settings → Secrets and variables → Actions 中新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 在 Settings → Pages → Build and deployment 中选择 `GitHub Actions`。
4. 推送到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并发布。

如果仓库使用自定义域名，需把 workflow 里的 `VITE_BASE_PATH` 改成 `/`。
