---
name: tech-stack-scaffolding
description: Use when bootstrapping a new project or aligning an existing one to house conventions — frontend/fullstack (bun+vite+react+tailwind v4+shadcn+oxlint/oxfmt), browser extensions (WXT/MV3), Python CLI (uv+hatchling+Typer+just), Go CLI (mise+golangci-lint+just). Provides drop-in config templates, script naming conventions per stack, icon/zip pipelines, and the concise AGENTS.md format (readable in one minute).
---

# 技术栈脚手架与项目初始化惯例

四条技术栈主线的标准初始化。选型基线：新项目**直接 oxlint/oxfmt（跳过 biome）**、插件**直接 WXT（跳过 crxjs）**。

## 1. 前端 / 全栈 Web（bun + vite + react 19 + tailwind v4 + shadcn）

**`.oxlintrc.json`**（几乎逐字通用）：
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "oxc", "unicorn", "import", "vitest", "jsx-a11y"],
  "rules": {
    "@typescript-eslint/consistent-type-imports": ["error", { "fixStyle": "inline-type-imports", "prefer": "type-imports" }],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "args": "after-used", "argsIgnorePattern": "^_", "caughtErrors": "none", "varsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "error",
    "react/no-array-index-key": "warn",
    "unicorn/prefer-node-protocol": "error"
  },
  "settings": { "react": { "version": "19.2" } }
}
```
简化变体：`"categories": {"correctness":"error","perf":"error","suspicious":"error"}`。

**`.oxfmtrc.json`**：`printWidth 100 / tabWidth 2 / singleQuote / trailingComma "all"` + ignorePatterns（node_modules、build、coverage 等）。

**scripts 命名（强惯例）**：
```json
{
  "lint": "oxlint src server && oxfmt --check src server && tsc --noEmit",
  "lint:fix": "oxlint src server --fix && oxfmt src server --write",
  "lint:format": "oxfmt src server --write",
  "test": "vitest run", "test:coverage": "vitest run --coverage",
  "check": "bun run --parallel lint test"
}
```
`lint` = 检查门禁（含 format --check 和 tsc --noEmit）；`check` = 提交前一键收口。

- monorepo（pnpm workspace + turbo）：每个 package 自定义 `lint`，根用 `turbo run lint` 调度；type-aware 时 `oxlint --type-aware --tsconfig tsconfig.json`，需要独立 `tsconfig.oxlint.json`（`moduleResolution: "bundler"`、`verbatimModuleSyntax`、`noEmit`、strict）。**坑：type-aware 不接受 `baseUrl`，用 `paths` 代替。**
- shadcn `components.json`：style `new-york` + baseColor `neutral` + cssVariables；alias `@/components`、`@/lib/utils`。

## 2. 浏览器插件（WXT / MV3）

`wxt.config.ts` 是唯一构建入口：
```ts
export default defineConfig({
  srcDir: "src", entrypointsDir: "entrypoints", outDir: "dist",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "...", version: packageJson.version,   // 版本单一真源 = package.json
    icons: { "16": "/icons/icon-16.png", "32": "...", "48": "...", "128": "..." }
  },
  alias: { "@": resolve("src") },
  vite: () => ({ plugins: [tailwindcss()] })     // tailwind v4 走 @tailwindcss/vite
});
```
- scripts：`dev: wxt` / `build: wxt build` / `zip: wxt zip` / `postinstall: wxt prepare`（必须先于 typecheck，生成 `.wxt` 类型）。
- 图标固定 [16,32,48,128]：轻量用 `sips -z 16 16 logo.png --out ...`；工程化用 `@resvg/resvg-js` 从 SVG 渲染（先补正方形 viewBox）。
- `.gitignore`：`entrypoints/` 源码**提交**；`.wxt` / `.output` / `dist` **忽略**。
- 从 crxjs 迁移：移除 `@crxjs/vite-plugin` 与 manifest.config.ts，删自定义打包脚本，出包统一 `wxt zip`。

## 3. Python CLI（uv + hatchling）

- **src layout** 固定；`[project.scripts]` 定义 CLI 入口；依赖基线 Typer + httpx + Rich + Pydantic。
- 目录按职责 ≤6 组：`src/<pkg>/{commands,services,formatters,core,models,http}` + `tests/`。
- 质量三件套：`ruff`（`select = ["E","F","I","UP","B"]`，line-length 100）+ `pyright`（basic）+ `ty`。
- 动态版本：`dynamic = ["version"]` + `[tool.hatch.version] path = "src/<pkg>/__about__.py"`。
- `justfile` 编排：`lint / lint-fix / lint-format / check(pyright+ty) / test / build(uv build --wheel) / publish-check(dry-run) → publish-test(TestPyPI) → publish`；**`just isok` = lint-fix + lint-format + check + test，提交前固定收口入口**。

## 4. Go CLI

- 工具链版本用 `mise` 钉死（`mise.toml` 声明 go 版本，命令走 `mise x go@x.y.z -- go ...`）。
- `justfile`（`set shell := ["bash","-euo","pipefail","-c"]`）：`fmt / fmt-check / vet / lint(golangci-lint) / test / build / check`（check 聚合 fmt-check+vet+test）。
- `.golangci.yml` 只开稳妥规则，避免噪音。
- CI 加 `quality` job（gofmt + vet + test）；`v*` tag 触发矩阵构建 `<name>-<version>-<platform>.tgz`。

## 5. 新项目周边标配

- `LICENSE`（MIT）+ `CHANGELOG.md`（起始 0.1.0，顶部 `## Unreleased`）+ README；对外项目 CHANGELOG/README 中英双份，并在 AGENTS.md 写明「需维护中英文两份」。
- **AGENTS.md 精简写法（1 分钟能读完）**，固定四段：
  1. 文档定位：工程协作入口，不重复 README、不展开业务参数；
  2. 技术栈：对齐 package.json/pyproject 真实依赖逐条列；
  3. 开发流程：固定顺序（装依赖 → 定向测试 → 全量校验 → `just isok`/`check` 收口 → 提交）；
  4. 代码目录说明：按职责分层 ≤6 组，点明读代码入口顺序。
  可选：跨模块同步清单（「新增 X 必须同步 N 处」）、安全红线、常见坑。风格：中文、短句、强约束、全部核对真实实现，不写泛化模板。

## 6. script 语义对照表

| 语义 | 前端 | Python (just) | Go (just) |
|---|---|---|---|
| 检查 | `lint` | `lint` + `check` | `fmt-check` + `vet` + `lint` |
| 自动修 | `lint:fix` | `lint-fix` | `fmt` |
| 格式化 | `lint:format` | `lint-format` | `fmt` |
| 测试 | `test` / `test:coverage` | `test` | `test` |
| 一键收口 | `check` | `isok` | `check` |
| 出包 | `build` / `zip`(wxt) | `build` / `publish` | `build` |
