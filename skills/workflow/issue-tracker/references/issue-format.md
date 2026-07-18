# Issue Format Specification

## Issue Directory Contents

```
RD-401/
├── meta.yaml        # required: structured metadata
├── design.md        # optional: detailed design document
├── discussion.md    # optional: chronological discussion log
├── notes.md         # optional: implementation notes and decision drift
└── design.html      # generated: HTML rendered version
```

## meta.yaml

The single source of truth for issue metadata. All structured data lives here.

### Schema

```yaml
id: RD-401
title: 建立桌面端 IPC Contract Map
type: feature                  # feature | bug | chore | refactor | docs
priority: P1                   # P0 (critical) | P1 (high) | P2 (medium) | P3 (low)
status: in-progress            # backlog | todo | in-progress | in-review | done | cancelled
created_at: 2026-05-22
updated_at: 2026-05-23
created_by: Kevin              # person or agent who created

# Optional fields
assignee: Kevin
milestone: v0.5.0
labels:                        # freeform tags
  - desktop
  - ipc
  - typescript

# PR tracking
pull_requests:
  - url: https://github.com/xingkaixin/yomitomo/pull/117
    status: draft              # draft | open | merged | closed
    branch: feat/ipc-contract-map
    updated_at: 2026-05-23

# Dependencies
depends_on: []                 # list of issue IDs this blocks on
blocks: []                     # list of issue IDs blocked by this

# Completion
completed_at:                  # filled when status becomes done
cancelled_at:                  # filled when status becomes cancelled
cancel_reason:                 # brief reason if cancelled

# Summary (one-liner for index views)
summary: >-
  将 main/preload/renderer 之间散落的 IPC channel 收敛到
  单一 typed contract，实现编译期类型检查。
```

### Required Fields

| Field | Type | Description |
|---|---|---|
| id | string | Issue ID, format `{PREFIX}-{NUMBER}` |
| title | string | Human-readable title |
| type | enum | feature / bug / chore / refactor / docs |
| priority | enum | P0 / P1 / P2 / P3 |
| status | enum | Must match the directory the issue is in |
| created_at | date | ISO date |
| updated_at | date | ISO date, updated on any change |
| created_by | string | Creator identifier |

### Optional Fields

All other fields are optional. Only include fields that have values. Do not write empty arrays or null placeholders for fields that are simply absent.

### Status Consistency

The `status` field in meta.yaml MUST match the directory the issue physically resides in. When moving an issue directory, always update this field. This redundancy is intentional: it allows reading status from meta.yaml without needing to know the directory path.

## design.md

The detailed design document. Created when the issue requires technical specification beyond what fits in the title and summary.

### Template

```markdown
# {ISSUE_ID}: {Title}

## 背景

为什么需要做这件事。引用现有代码位置、用户反馈、或技术约束。

## 目标

这次改动要达成什么。用可验证的语句描述。

## 非目标

明确排除的范围，防止 scope creep。

## 设计

### 方案概述

整体方案的核心思路。

### 关键决策

列出已经做出的设计决策和理由。

### 影响范围

涉及哪些文件、模块、接口。

## 验证方案

如何验证改动正确：测试命令、冒烟测试步骤、typecheck 等。

## 实施阶段

如果需要分阶段实施，列出每个阶段的边界和交付物。

## 待讨论

尚未确定的问题，标注待决策方和截止时间。
```

### Writing Rules

- 中文为主体，技术术语保留英文原文
- 代码、类型名、字段名、文件路径不翻译
- 每个代码引用必须指向真实文件路径或符号，不得虚构
- 设计决策用确定性语言，待讨论事项用"待确认"/"待讨论"
- 不写动机填充句（"这个方案非常好因为..."），每句话必须承载信息
- 如果某个 section 没有内容，删除该 section，不要留空 section

### Section Selection

Not every issue needs every section. Minimal issues (simple bugs, chores) may only have 背景 and 验证方案. Feature designs typically need 背景, 目标, 非目标, 设计, 验证方案. Use judgment based on complexity.

## discussion.md

Chronological log of discussions and decisions. Each entry is appended at the top (reverse chronological).

### Format

```markdown
# {ISSUE_ID} Discussion Log

## 2026-05-23 - 确认验证方案

**参与者**: Kevin, Codex

**讨论内容**:

讨论了实施后的用户侧验证点。确认这是一个纯类型收敛改动，
不改变用户可见行为，验证重点是冒烟测试现有功能不回归。

**结论**:

列出 7 项冒烟验证点，覆盖设置、provider、文章导入、EPUB、
批注、AI 回复、辅助功能。

---

## 2026-05-22 - 需求澄清与设计确认

**参与者**: Kevin, Codex

**讨论内容**:

...

**结论**:

...
```

### Rules

- 新条目追加在文件顶部（文件标题之后）
- 每条记录必须有日期和参与者
- "讨论内容"记录过程，"结论"记录最终决策
- 如果讨论没有产生结论，写"暂无结论，待后续讨论"
- 不要把整段对话原文粘贴进来，提炼关键信息和决策点

## notes.md

Implementation notes created when work on an issue uncovers a meaningful mismatch between the issue definition and the actual code, constraints, or product behavior, causing the agent to make a new decision.

Use `notes.md` for implementation-time decision drift. Keep `design.md` as the intended plan, and keep `discussion.md` for user/team conversations.

### Format

```markdown
# {ISSUE_ID} Implementation Notes

## 2026-05-23 - 调整验证边界

**触发原因**:

实现时发现现有测试覆盖的是 renderer store patch，而 issue 原定义要求验证完整 store broadcast。

**新决策**:

保留局部 article patch 路径作为验证重点，不新增完整 store broadcast 验证。

**影响**:

验证方案从全量 store 更新改为文章级 patch 更新，实施范围不扩大。
```

### Rules

- 新条目追加在文件顶部（文件标题之后）
- 只记录与 issue 定义明显不一致并导致新决策的情况
- 每条记录必须说明触发原因、新决策和影响
- 不记录普通进度、无决策的调试过程或已经写入 design.md 的既定设计
- 不要为了让实现合理化而改写原始 issue 定义；用 notes.md 保留偏差和决策历史

## PR Tracking in meta.yaml

Record branch names exactly as created. Branch names must not include issue IDs; keep issue traceability in meta.yaml and PR descriptions.

Some existing issues may contain a legacy `pr` field such as `pr: null` or `pr: https://...`. When updating PR state, preserve unrelated metadata, prefer the normalized `pull_requests` list, and keep `pr` in sync with the primary PR URL if the field already exists. Do not rewrite the whole file just to normalize old metadata.

### Adding a PR

When user says "关联 PR #117" or AI creates a PR:

```yaml
pull_requests:
  - url: https://github.com/xingkaixin/yomitomo/pull/117
    status: draft
    branch: feat/some-feature
    updated_at: 2026-05-23
```

### Updating PR Status

When user says "PR 已合并" or AI checks GitHub:

```yaml
pull_requests:
  - url: https://github.com/xingkaixin/yomitomo/pull/117
    status: merged
    branch: feat/some-feature
    updated_at: 2026-05-24
```

When a linked implementation PR is merged and the issue is complete, also update:

```yaml
status: done
updated_at: 2026-05-24
completed_at: 2026-05-24
```

Then move the issue directory into the matching `done/` folder. Do not set `completed_at` while the PR is still draft/open, and do not leave `status` different from the physical status directory.

### Multiple PRs

An issue can have multiple PRs (e.g., one for the main implementation, one for follow-up fixes):

```yaml
pull_requests:
  - url: https://github.com/xingkaixin/yomitomo/pull/117
    status: merged
    branch: feat/ipc-contract
    updated_at: 2026-05-24
  - url: https://github.com/xingkaixin/yomitomo/pull/120
    status: open
    branch: fix/type-export
    updated_at: 2026-05-25
```
