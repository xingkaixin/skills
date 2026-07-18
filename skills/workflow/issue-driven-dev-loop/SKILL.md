---
name: issue-driven-dev-loop
description: Use when working through a backlog of issues one by one — picking up an issue, refining its design, implementing, opening a PR, updating issue status after merge, and moving to the next. Covers local file-based .issues/ trackers (meta.yaml, status-as-directory), design-confirm-implement loops, branch/commit conventions, draft PRs with CI follow-up, and parallelizing independent issues with subagents.
---

# Issue 驱动开发循环

围绕本地 `.issues/` 目录（或 Linear 等外部 tracker）的完整开发循环：领取 issue → 细化设计并确认 → 实现 → 提交 PR → merge 后更新状态 → 继续下一个。

## 1. Issue 的组织方式（本地 `.issues/`）

```
.issues/
├── .config.yaml              # prefix、init_number
├── backlog/                  # 全局未排期
├── v0.5.0/                   # 里程碑目录
│   ├── milestone.yaml
│   ├── backlog/ todo/ in-progress/ in-review/ done/ cancelled/
└── _archive/                 # 已关闭里程碑整体移入
```

- 单个 issue 是一个**目录**（如 `ISS-401/`，前缀由 `.config.yaml` 定义），内含 `meta.yaml`（必需，唯一 source of truth）+ 按需的 `design.md`（既定方案）、`discussion.md`（时间倒序讨论日志）、`notes.md`（实施期偏差决策，不改写原始定义）。
- **状态流转 = 物理移动目录**，同时必须同步 `meta.yaml` 的 `status` 字段（双冗余，两处都要改）。
- `meta.yaml` 关键字段：`id`、`title`、`type`(feature|bug|chore|refactor|docs)、`priority`(P0-P3)、`status`、`milestone`、`pull_requests[]`(url/status/branch)、`depends_on`/`blocks`、`completed_at`、`summary`。
- 定位 issue 永远先 `find .issues -type d -name "ISS-401"`，不要假设它在哪个状态目录。

## 2. 开工序列（不要拿到 issue 就写代码）

1. 读约束文件：issue-tracker 的 SKILL/格式说明、commit 规范、项目 `AGENTS.md`。
2. `git status --short --branch` 确认在干净的 main。
3. 盘点 backlog：读全部 `meta.yaml` + `design.md`。
4. **按「谁为谁建立契约边界」推导依赖顺序**，而不是按编号或优先级机械排序，写出处理计划。
5. 已有详细设计的 issue 直接实现（用户可预授权「待确认项采用默认方案」）；需细化的走：扩写 design.md 并把不确定项标「待讨论决策」→ 用户拍板 → **先去代码核实再写回文档**（避免写虚）→ 把「待讨论」改为「明确决策」→ 用户确认后才动代码。待确认事项必须固化进 design.md，不能只留在对话里。

## 3. 分支与 commit

- **模式由用户指令决定**：
  - 一 issue 一 PR：独立分支 `feat/{issue-id}-{slug}`（如 `feat/iss-42-windowed-data-load`）。
  - 直接 main：不开分支，靠合理拆分 commit + issue 状态推进；commit body 加 `Refs: ISS-xxx` 追溯，可带 `Verification: <验证命令>`。
- commit 遵循约定式提交：类型前缀 + 可选 scope（`fix(web):`），subject 祈使语气、首字母大写、≤50 字符、无尾标点。**一个逻辑边界一个 commit**，绝不混两个 issue。
- **修 bug 铁律：先加日志读运行时输出，再改代码**——插临时标记日志（如 `[ISS-42]`），跑测试读真实执行顺序确认根因，不静态猜测。

## 4. 提交 PR

1. `git push -u origin <branch>`。
2. 创建 **draft PR**（默认 draft，不直接 open）；有 `.github/pull_request_template.md` 则套模板。
3. PR 标题：约定式提交格式、英文小写；PR 正文英文，结构：`## Summary` / `## Root cause`(bug 类) / `## Impact` / `## Validation`(验证命令) + 结尾 `Issue: ISS-42`。
4. `gh pr view <branch> --json number,url,state,isDraft` 回读确认。
5. **建 PR 后立即回写 issue**：status `in-progress→in-review`，追加 `pull_requests` 条目，`mv` 目录到 `in-review/`。
6. 跟进 CI：失败则读日志定位、本地修复补 commit push；**根因具有普遍性时把预防规则写进 AGENTS.md** 防复发。

## 5. Merge 后收尾与下一个

1. `gh pr view <n> --json state,mergedAt` 核实确已 `MERGED`。
2. 更新 meta.yaml：`in-review→done`、PR status→`merged`、填 `completed_at`；`mv` 到 `done/`。
3. `git switch main && git pull`，从最新 main 建下一分支。
4. 按依赖顺序取下一个 issue，`mv` 到 `in-progress/`，循环。
5. 里程碑发布后经确认将整个里程碑目录 `mv` 到 `_archive/`。

## 6. 并行处理（大批量 backlog）

主 agent 先画依赖图，把**写入文件范围互不重叠**的 issue 分给 worker 子代理并行；每个子代理指令强制：不创建分支、不提交 commit、不改 `.issues/`、不 revert 他人改动、只改指定文件。返回后主 agent review diff 统一提交。会改同一文件群的 issue 必须串行。

## 7. 关键坑位清单

- [ ] **先探测 `.issues/` 是否在 .gitignore**：有的项目忽略（状态只留本机），有的纳入 git（issue 移动要随代码一起 commit）——这是最易错的点。
- [ ] meta.yaml `status` 与所在目录双向一致。
- [ ] 语言分工固定：issue 文档/讨论/commit body/汇报用中文；commit subject/PR 标题/PR 正文用英文；代码、类型、字段、路径永不翻译。
- [ ] 尊重项目 AGENTS.md 的特殊要求（如 shell 命令前缀），不要写死通用命令。
