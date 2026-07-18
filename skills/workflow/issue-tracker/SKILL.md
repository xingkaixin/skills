---
name: issue-tracker
description: 'Local Markdown issue tracking system for managing feature requests, bugs, and version iterations within project repositories. Use when the user says "创建 issue", "新建需求", "建 bug", "issue", "需求跟踪", "版本迭代", "milestone", "里程碑", "看板", "issue 状态", "关联 PR", "更新进度", "归档", "backlog", or wants to create, update, query, move, or visualize issues stored in the local .issues/ directory. Also trigger when the user asks to generate an HTML view of an issue, check PR status, move issues between milestones or status lanes, initialize issue tracking for a project, or produce a summary of current iteration progress. Trigger even if the user just says "开个 issue" or references an issue ID like "RD-400".'
---

# Issue Tracker Skill

Local-first, Markdown-based issue tracking that lives inside the project repository. Replaces Linear / GitHub Issues for lightweight project management with full offline access.

## When to Read References

Before any operation, read the relevant reference:

- **First time or init**: `references/directory-spec.md` (directory layout, naming, init flow)
- **Creating or editing issues**: `references/issue-format.md` (meta.yaml schema, design.md template, discussion.md conventions)
- **Generating HTML**: `DESIGN.md` (visual system) and `references/html-template.md` (generation workflow)

## Core Concepts

### Directory Layout

```
.issues/
├── .config.yaml              # project-level config (prefix, init_number, etc.)
├── backlog/                   # unscheduled issues
│   └── RD-401/
├── v0.5.0/                    # milestone directory
│   ├── milestone.yaml         # milestone metadata
│   ├── backlog/               # planned but not started
│   ├── todo/                  # ready to work on
│   ├── in-progress/           # actively being worked
│   ├── in-review/             # PR submitted, awaiting review
│   ├── done/                  # completed
│   └── cancelled/             # dropped from this milestone
├── v0.6.0/
│   └── ...
└── _archive/                  # closed milestones move here
```

### Issue Directory

Each issue is a directory named by its ID (e.g., `RD-401/`):

```
RD-401/
├── meta.yaml        # structured metadata (required)
├── design.md        # detailed design document (created when needed)
├── discussion.md    # chronological discussion log (created when needed)
├── notes.md         # implementation notes and decision drift (created when needed)
└── design.html      # rendered HTML version (generated on demand)
```

### Status Flow

```
backlog → todo → in-progress → in-review → done
                                          → cancelled
```

Moving an issue between statuses means physically moving its directory from one status folder to another within the same milestone. Moving to a different milestone means moving it to that milestone's appropriate status folder.

### Issue ID

Format: `{PREFIX}-{NUMBER}`, e.g., `RD-401`.

- PREFIX is defined per project in `.config.yaml`
- NUMBER auto-increments from `init_number` (to avoid collision with existing Linear issues)

## Operations

### 1. Initialize Tracking

When user says "初始化 issue 跟踪" or equivalent:

1. Read `references/directory-spec.md`
2. Ask for: project prefix (default from repo name), init_number (starting issue number)
3. Create `.issues/` directory with `.config.yaml` and `backlog/`
4. Suggest adding `.issues/**/*.html` to `.gitignore` if HTML files should not be committed

### 2. Create Issue

When user says "创建 issue" / "新建需求" / "开个 bug":

1. Read `.issues/.config.yaml` to get prefix and next number
2. Determine placement: global `backlog/` or a specific milestone's `backlog/`
3. Create the issue directory with `meta.yaml`
4. If the user provides design details in the same message, also create `design.md`
5. Increment the counter in `.config.yaml`

### 3. Update Issue

When user says "更新 RD-401" or provides new design/discussion content:

1. Find the issue by ID (search across all milestone and status directories)
2. Update the relevant file (meta.yaml for status/PR changes, design.md for design, discussion.md for discussion)

### 4. Move Issue

When user says "把 RD-401 移到 in-progress" or "RD-401 移入 v0.5.0":

1. Locate the issue directory
2. Move it to the target milestone/status directory
3. Update meta.yaml timestamps

### 5. Query / List

When user says "当前进度" / "看板" / "v0.5.0 的状态":

1. Scan the relevant directories
2. Present a summary grouped by status
3. Include PR status if available in meta.yaml

### 6. Generate HTML

When user says "生成 RD-401 的 HTML" / "导出 HTML":

1. Read `DESIGN.md` and `references/html-template.md`
2. Read the issue's `meta.yaml`, `design.md`, and any relevant `notes.md` / `discussion.md`
3. Design a content-specific static HTML page from the markdown structure; do not use a generic Markdown-to-HTML script as the final output
4. Save the handcrafted page as `design.html` inside the issue directory

### 7. Link PR

When user says "关联 PR #117 到 RD-401":

1. Update meta.yaml with PR URL and current status (draft/open/merged)
2. If AI has GitHub access, fetch current PR state and update
3. If a PR is newly created for the issue, move the issue to `in-review` only after the PR exists and `meta.yaml` has been updated with the PR URL, branch, status, and `updated_at`

### 7a. Update Issue After PR Merge

When user says "PR merged, 更新 issue" or equivalent:

1. Identify the issue from the explicit issue ID, the PR number/URL, the current branch's PR, or the branch recorded in `meta.yaml`. If more than one issue matches, ask before editing.
2. Verify the PR state with GitHub CLI or a GitHub connector when available. If no GitHub access is available, state that the update is based on the user's report.
3. Only move an issue to `done` when the relevant PR is confirmed or explicitly reported as merged, or when the user says the non-PR change is otherwise complete.
4. Update `pull_requests[*].status`, `pull_requests[*].updated_at`, `status`, `updated_at`, and `completed_at`, then physically move the issue directory so its status folder matches `meta.yaml`.
5. Leave `.issues/` changes uncommitted when the repository treats issue files as local-only.

### 8. Archive Milestone

When user says "归档 v0.5.0":

1. Move the entire milestone directory to `_archive/`
2. Keep all content intact

### 9. Record Implementation Notes

During implementation, if reality differs materially from the issue definition and forces a new decision, append the decision to the issue directory's `notes.md`. Record only meaningful deviations that change scope, design, validation, or tradeoffs; do not log routine progress.

### 10. Develop an Issue

When implementing an issue, before editing source code:

1. Locate the issue directory and confirm its current status
2. Inspect the current branch, upstream, and `git status --short`. Do not reuse a branch that already contains unrelated work.
3. Create or switch to a dedicated git branch. Branch names must use Conventional Commit type prefixes and must not include the issue ID: `{type}/{slug}`, e.g., `feat/ipc-contract-map`, `fix/provider-keyring`, `refactor/settings-store`. Choose the type from the primary change being implemented, not mechanically from the issue type.
4. Decide and state the commit plan before editing. Name the planned review units and the verification for each unit. Revise the plan if runtime findings change the real boundaries.
5. Use one commit only when the issue is one coherent review unit. Otherwise split commits by API/contract change, data migration, user-visible behavior, visual/theme system, integration glue, or independent follow-up fix. Do not split tests away from the code they validate unless the test-only change is itself the review unit.

During implementation:

1. After each coherent review unit is implemented and verified, stage only the files for that unit and create a commit before moving to unrelated work.
2. Each commit should carry one coherent behavior or design change. Avoid one giant "implement issue" commit when multiple review boundaries exist, and avoid one commit per file or mechanical "fix lint" commits unless that mechanical change is independently reviewable.
3. Before committing, inspect `git diff --cached --name-only` and follow project instructions for local issue files. If `.issues/` is local-only for the repository, do not stage it.
4. Use the repository's commit message rules. For issue implementation commits, write a useful commit body/description; do not make the body only `Refs: RD-123`.
5. In the commit body, include the non-obvious context for that slice: why this slice exists, what boundary it changes, and how it was verified. Keep it short and wrap lines. Put the issue ID in a footer such as `Refs: RD-123` or `Issue: RD-123` after the explanatory body.
6. Before giving a final implementation summary or opening a PR, run `git status --short`. If source, test, or documentation files remain modified or untracked, either commit them as a focused unit or explicitly state why they are intentionally uncommitted.
7. Do not report an issue implementation as complete while source changes are still uncommitted, unless the user explicitly requested no commit or the work is blocked before a safe commit can be made.
8. Treat the issue context as scoped to the current issue ID, branch, or linked PR. When the user starts an unrelated task in the same thread without referencing that issue, stop updating the old issue and start from normal git/worktree discovery.

Commit body template for non-trivial issue commits:

```text
{type}({scope}): {subject}

Explain why this review unit exists and what boundary it changes.
Mention the verification that was run for this unit, or why it was not run.

Refs: RD-123
```

Good issue commit split examples:

- Theme contract tokens first, then component rendering and animation behavior, then an independent runtime bug fix discovered during validation.
- Database/schema migration first, then application reads/writes, then UI integration if each layer is reviewable separately.
- Asset-only replacement as one commit when the work is only generated binaries and verification.

Poor split examples:

- One commit named `feat: implement RD-123` that mixes contract, UI, tests, assets, and follow-up bug fixes.
- Separate commits for `update code`, `update tests`, and `fix format` when they validate the same behavior.
- Commit body containing only `Refs: RD-123`.

## Locating an Issue

Issues can be in any milestone's any status directory, or in the global backlog. To find an issue by ID:

```bash
find .issues -type d -name "RD-401" | head -1
```

Always search before assuming location. If the user references a PR instead of an issue ID, search `meta.yaml` files for that PR URL/number or branch name and use the issue only when there is exactly one match. Report the current location to the user when operating on an issue.

## Writing Conventions

- meta.yaml: YAML, structured fields, no prose
- design.md: 中文为主，技术术语保留英文，代码/类型/字段名不翻译
- discussion.md: 按时间倒序追加，每条记录带日期和参与者标识
- notes.md: 记录实现过程中与 issue 定义明显不一致而产生的新决策，按时间倒序追加
- HTML output: light theme only, self-contained single file, content-specific visual page based on `DESIGN.md`

## Integration with Existing Workflows

This system is designed to coexist with:

- **AGENTS.md**: Issue IDs can be referenced in commit messages and AGENTS.md constraints
- **KLIP documents**: Complex issues may reference or embed KLIP documents in their design.md
- **Git branches**: Create a dedicated branch before issue implementation; use a Conventional Commit type prefix without the issue ID, e.g., `feat/ipc-contract-map`
- **Commits**: Split issue work into focused, reviewable commits that map to coherent behavior or design changes; include useful commit bodies for non-trivial issue commits, with the issue ID as a footer rather than the only description
- **PR descriptions**: Include issue ID for traceability
