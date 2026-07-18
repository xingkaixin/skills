---
name: cloudflare-deploy-migration
description: Use when deploying a site to Cloudflare or migrating one off Vercel — static sites to Pages, Next.js via vinext to Workers, full-stack apps to Workers with D1/KV/Durable Objects. Covers wrangler config split (dev/deploy/e2e), secret management, CI with artifact handoff and HOME-isolated wrangler E2E, analytics replacement, and a root-cause pitfall table (charset mojibake, assets-only worker 404, D1 migration naming, bundle guards).
---

# Cloudflare 部署与 Vercel 迁移

按站点复杂度选三条路径：纯静态 → Pages；Next.js → vinext + Workers；带后端 → Workers + D1/KV/DO。

## 1. 纯静态站 → Cloudflare Pages（Direct Upload）

```bash
npx wrangler login
wrangler pages deploy dist --project-name=<name>          # 必须传构建产物目录，不要传 "."
wrangler pages deploy web --project-name=<name> --commit-dirty=true   # 工作区脏时
wrangler pages deploy web --project-name=<name> --branch=preview      # 预览分支
```

- 无服务端逻辑用 Pages；需要边缘逻辑才用 Workers static assets。
- `vercel.json` 的 SPA rewrite/headers 迁到 `public/_redirects`（`/* /index.html 200`）+ `public/_headers`，构建后自动进 dist。
- 移除 `@vercel/analytics` 依赖与 `<Analytics />` 组件。
- `.wrangler/` 是本地缓存，进 `.gitignore`。

## 2. Next.js → vinext + CF Workers

vinext（Cloudflare 官方，next CLI 的 drop-in replacement）：`vinext check`（兼容评分）→ `vinext init` → 脚本 `next dev/build/start → vinext dev/build/start`。

**关键经验：仓库已有自定义 `vite.config.ts`/`wrangler.jsonc` 时，放弃 `vinext deploy` 的自动配置，改手工链路**——否则自动配置与手写配置打架，产出 assets-only Worker 导致全站 404：

```bash
mv wrangler.jsonc wrangler.jsonc.bak   # 绕过 vinext build 的插件强检查
bun run build                          # 产出 dist/client + dist/server/entry.js
mv wrangler.jsonc.bak wrangler.jsonc
rm -f .wrangler/deploy/config.json     # 清理过期重定向缓存
bunx wrangler deploy --dry-run && bunx wrangler deploy
```

`worker/index.ts` 从真实产物 `import ... from "../dist/server/entry.js"`；`wrangler.jsonc` 手写 `main` + `assets.directory` + `compatibility_flags: ["nodejs_compat"]`。

SSR 最大成本是 CJS/ESM 互操作：CJS 叶子依赖收敛进 `vite.config.ts` 的 `ssr.optimizeDeps`（**不要放含 React 的包本体**，会拉出第二份 React 触发 invalid hook call）；`_app`/`_document` 改函数式。

## 3. 带后端应用 → Workers + D1/KV/DO

单 Worker（Hono）+ `[assets]` 托管前端。基础配置（用新式 `[assets]`，不是旧 `[site]`）：

```toml
name = "app"
compatibility_date = "2026-03-17"
main = "dist/server.js"
[assets]
directory = "dist/client"
not_found_handling = "single-page-application"
```

- **配置文件拆分**：`wrangler.toml`（dev 默认，本地 KV/D1）/ `wrangler.deploy.toml`（生产真实资源 ID）/ `wrangler.e2e.toml`（E2E）。**彼此没有继承关系**，wrangler 只读 `--config` 指定的那一个；代价是易漂移，需人为保持同步。
- **D1 上线**：`wrangler d1 create <db>` 拿 id 回填 → `wrangler d1 migrations apply <database_name> --remote`。坑：位置参数是 **database_name 不是 binding 名**。先迁移再部署 Worker。
- **Durable Objects** 无需 create：声明 `[[durable_objects.bindings]]` + `[[migrations]]`（`new_sqlite_classes`），随 deploy 注册；class 名上线后保持稳定。
- **bundle 守卫**：单文件 server bundle 残留分包引用会运行时报 `No such module`——加 verify-server-bundle 脚本进 build 链。

## 4. 变量与 Secret 三分法

- 前端构建时变量 `VITE_*` → Vite `.env.production`（本就浏览器可见，绝不进 secret）。
- Worker 运行时非敏感 → `[vars]`（**当 `.env` 写，值统一字符串**；wrangler 自身字段才用原生类型）。
- Worker 运行时敏感 → `wrangler secret put <key>` / `--secrets-file <file>`（文件进 `.gitignore` 并附 `.example`）。本地开发用 `.dev.vars`。
- secret 与 var 运行时无差别，区别只是 Dashboard 不回显；同一 key 不要两边都配。

## 5. CI 与 E2E

- test workflow：`build` 与 `test_e2e` 独立 job，artifact 传产物；**上传/下载两端都必须 `path: dist`**（`dist/**` 会多嵌层、`.` 会丢层，与 `main = "dist/server.js"` 的契约对不上）。加 `concurrency` + `cancel-in-progress`。
- **E2E 在 wrangler 运行时上跑（HOME 隔离）**：
  ```bash
  HOME="$PWD/.wrangler-home" wrangler dev --config wrangler.e2e.toml \
    --local --no-bundle --persist-to .wrangler/state/e2e \
    --ip 127.0.0.1 --port 3000 --inspector-port 0 --log-level error
  ```
  wrangler 默认写 `~/.config/.wrangler` 全局状态，CI 不可控；HOME 重定向进仓库内目录，`--local --no-bundle` 直接吃已构建产物。

## 6. Analytics 替换

只改静态入口 HTML 的 `<head>`，不引 SDK：
- CF Web Analytics：`<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "<每站不同>"}'></script>`
- umami：`<script defer src="https://cloud.umami.is/script.js" data-website-id="...">`
- 两者不要并存（重复统计）。

## 7. 根因速查表

| 现象 | 根因 | 解法 |
|---|---|---|
| 刷新页面中文乱码（SPA 路由正常） | SSR 响应 `Content-Type: text/html` 缺 `charset=utf-8`，浏览器猜错编码 | Worker 里对 page render 响应补 charset（保留 Set-Cookie，不误伤 /api、图片、xml）；不要去改 React 树 |
| 部署后全站 404，`wrangler tail` 报 assets-only | 产物配置只有 assets 没有 main | 手工 build + deploy 链路（见 §2） |
| `Couldn't find DB with name 'X'` | D1 migrations 传了 binding 名 | 传 database_name + `--remote` |
| CI 报 entry-point not found | artifact 上传/下载路径嵌层不一致 | 两端都 `path: dist` |
| 运行时 `No such module "X-*.js"` | server bundle 残留分包引用 | 收敛服务端打包 + bundle 守卫脚本 |

## 8. 选型参考（免费额度）

CF Free：静态请求不限量、Workers/Functions 10 万次/天。Vercel Hobby：Function 100 万次/月、可配函数区域。纯静态内容站 → CF 更划算；重函数全栈或需函数区域可控 → Vercel。
