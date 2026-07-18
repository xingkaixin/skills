---
name: bilingual-release-changelog
description: Use when generating a changelog, bumping a version, or publishing a release for a project that maintains Chinese + English changelogs (CHANGELOG.md / CHANGELOG_zh.md / docs/zh + docs/en). Covers commit-range analysis, user-facing wording rules, single-source versioning per language stack (Python hatchling, Go ldflags, npm multi-platform, frontend package.json), tag/CI publishing, and recovery from partially failed releases.
---

# 双语版本发布与 Changelog 维护

维护「中文为源、英文为译」的双语 changelog，并完成版本号更新与发布的完整流程。核心约定：**中文永远是源语言，英文条目是中文的翻译**，不独立撰写。

## 1. 确定变更范围

按场景选一种模式，逐 commit 看改动文件，不要只按 commit 标题猜：

- **发布导向（最常用）**：上一个 tag 到 HEAD。
  ```bash
  git tag --list | rg '^v0\.6\.5$'           # 确认基准 tag 存在
  git log --oneline --decorate v0.6.5..HEAD
  # 逐 commit 查看涉及文件，判断用户可见性：
  for c in $(git rev-list --reverse v0.6.5..HEAD); do
    git show --no-patch --pretty=format:'%h %s' $c; echo
    git show --name-only --pretty=format: $c | sed '/^$/d'; echo
  done
  ```
- **Feature 分支导向**：`git log main..HEAD --oneline` + `git diff main..HEAD --stat`。
- **按日期（少用）**：`git log --since='... 00:00' --until='... 23:59:59' --oneline`。

## 2. 条目写作规范

- Keep a Changelog 风格：`## [版本] - YYYY-MM-DD`，下分 `### 新增 / 变更 / 问题修复`（英文 `Added / Changed / Fixed`）。
- 未发版内容先进 `## [未发布]` / `## [Unreleased]`；正式发版时落版本号+日期，发布日期与用户确认。
- **面向普通用户措辞**：写功能点，不写代码更新说明；非技术人员要能读懂。
- 对新功能的修复类 commit，**按新功能介绍**来写，不写成 fix。
- 过滤纯内部重构、测试补充、依赖升级细节；docs/CI 提交是否收录属于边界项，可与用户确认。

## 3. 双语文件同步（最高频返工点）

1. 先探测本项目的真源布局，**不要假设路径**：
   ```bash
   rg --files -g 'CHANGELOG*' -g 'changelog*'
   ```
   常见布局：根 `CHANGELOG.md`(英) + `docs/zh/CHANGELOG.md`(中)；`CHANGELOG.md`(英) + `CHANGELOG_zh.md`(中)；文档站 `docs/zh/changelog/` + `docs/en/changelog/`；也可能只有中文单文件（内部项目）。注意历史文件名可能带 typo，沿用现状即可。
2. 列出**全部**目标文件清单（可能是 2-3 份），一次性同步更新，逐一确认。漏更 docs/en 或 docs/zh 是最常见的返工原因。
3. 先写中文条目，英文按中文翻译，遵循既有文件的格式与用词。

## 4. 版本号单一来源

按语言栈消除「改版本要动 N 处」的问题：

- **Python (uv + hatchling)**：版本只写在 `src/<pkg>/__about__.py`；`__init__.py` 用 `from <pkg>.__about__ import __version__` 保留公开属性；`pyproject.toml` 用 `dynamic = ["version"]` + `[tool.hatch.version] path = "src/<pkg>/__about__.py"`。发布前校验 tag 版本 == `__about__` 版本。
- **Go**：代码里 `var version = "dev"`，CI 发布时用 `-ldflags` 注入 Git tag；Git tag 是版本真源。
- **npm 多平台包**：所有 `npm/*/package.json` 平时占位 `0.0.0-dev`，发布时脚本（如 `scripts/set-npm-version.mjs <version>`）一次性写入主包和全部平台包；平台包版本必须与主包严格一致，主包用 `optionalDependencies` 精确锁版本。
- **前端**：`package.json` 为唯一源，构建时注入 UI 显示；版本号点击跳转对应语言的 changelog 页（新开标签）是惯用的产品化收尾。

## 5. 发布与 CI

- 发版前跑质量门禁（lint/test/覆盖率）。
- **PyPI**：`vX.Y.Z` tag 触发，`uv build --no-sources` + `uv publish`（两步分离），发布 job 校验 tag 版本一致。workflow 命名 `pypi.yml` / `npm.yml`。
- **npm 跨平台原生分发**：主包只放 JS 启动器，各平台二进制拆分为 `os`/`cpu` 匹配的平台包（`darwin-arm64`、`linux-x64`…）。上游不支持的平台**不发假包**，留扩展位即可。
- **Trusted Publishing (OIDC)**：workflow 加 `id-token: write`；不要设置空的 `NODE_AUTH_TOKEN`（会导致 E401）。
- `npm publish` 本地目录必须带 `./` 前缀（`npm publish ./npm/pkg-dir`），否则被解析为 package spec 推导成 Git 地址。

## 6. 发布失败恢复

- **原则：tag 不可变，优先发新 patch 版本**。rerun job 无效——Actions 按 tag 指向的旧 commit 取代码。
- 坚持复用版本号时，删 tag 重打：
  ```bash
  git tag -d v0.6.0
  git push origin :refs/tags/v0.6.0
  git tag v0.6.0 <fixed-commit>
  git push origin v0.6.0
  ```
  前提是发布脚本具备幂等：先 `npm view <name>@<version>` 检查，已存在则 skip，支持安全重跑。
- 排查半成功发布：用 `npm view <pkg>@<ver> version --json` 逐包探测实际发布状态，定位断点，不靠猜。

## 7. 收尾清单

- [ ] 所有 changelog 文件（中/英/文档站）已同步
- [ ] README.md / README_zh.md 按需更新（中文为源）；平台支持表、用法示例同步
- [ ] 版本号单一源已更新，其余位置为派生
- [ ] 项目内相关 SKILL/文档未落后于新能力
- [ ] lint/test 通过后再打 tag
