# Directory Specification

## Project Configuration

File: `.issues/.config.yaml`

```yaml
# Project issue tracking configuration
prefix: RD                    # Issue ID prefix
init_number: 400              # Starting number (set to avoid collision with Linear)
next_number: 401              # Auto-incremented, managed by the skill
project: yomitomo             # Project name
created_at: 2026-05-23
```

### Fields

| Field | Required | Description |
|---|---|---|
| prefix | yes | Issue ID prefix, uppercase letters, 1-4 chars |
| init_number | yes | The number set at initialization to skip existing Linear IDs |
| next_number | yes | Current counter, incremented on each issue creation |
| project | yes | Project identifier |
| created_at | yes | Date of initialization |

## Top-Level Directory Structure

```
.issues/
├── .config.yaml
├── backlog/                   # Global backlog: unscheduled issues
├── {milestone}/               # One directory per milestone/version
│   ├── milestone.yaml
│   ├── backlog/
│   ├── todo/
│   ├── in-progress/
│   ├── in-review/
│   ├── done/
│   └── cancelled/
└── _archive/                  # Completed milestones are moved here
```

## Milestone Directory

Each milestone represents a release version or iteration cycle.

### milestone.yaml

```yaml
title: v0.5.0
description: 桌面端 IPC 重构与阅读体验优化
status: active                 # active | completed | cancelled
created_at: 2026-05-23
target_date: 2026-06-15        # optional
completed_at:                  # filled when archived
```

### Status Subdirectories

Each milestone contains these fixed subdirectories:

| Directory | Meaning |
|---|---|
| `backlog/` | Planned for this milestone but not yet actionable |
| `todo/` | Ready to start, dependencies resolved |
| `in-progress/` | Actively being worked on |
| `in-review/` | Implementation done, PR submitted |
| `done/` | Completed, PR merged or change verified |
| `cancelled/` | Dropped from this milestone |

### Status Transitions

Moving an issue = moving its directory:

```bash
# Start working on RD-401
mv .issues/v0.5.0/todo/RD-401 .issues/v0.5.0/in-progress/

# Submit PR
mv .issues/v0.5.0/in-progress/RD-401 .issues/v0.5.0/in-review/

# PR merged
mv .issues/v0.5.0/in-review/RD-401 .issues/v0.5.0/done/
```

When moving, also update `meta.yaml` field `updated_at`.

## Global Backlog

`.issues/backlog/` holds issues that are not assigned to any milestone yet. When an issue gets scheduled into a milestone, move it from `backlog/` to `{milestone}/backlog/`.

## Archive

`.issues/_archive/` holds completed or cancelled milestones. The entire milestone directory is moved here intact:

```bash
mv .issues/v0.4.0 .issues/_archive/v0.4.0
```

## Initialization Flow

1. Create `.issues/` directory
2. Create `.config.yaml` with user-provided prefix and init_number
3. Create `backlog/` directory
4. Optionally create a first milestone directory with all status subdirectories
5. Add to `.gitignore` (suggested, not mandatory):
   ```
   # Issue tracker generated files
   .issues/**/*.html
   ```

## Filesystem Rules

- Directory names are case-sensitive, use exact casing as specified
- Issue directory names match their ID exactly: `RD-401`, not `rd-401` or `RD_401`
- No spaces in any directory or file names
- milestone directory names should match their title field (e.g., `v0.5.0`)
- Status directory names are lowercase with hyphens as specified above
