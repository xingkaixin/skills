---
name: first-time-setup
description: First-time setup flow for baoyu-article-illustrator preferences
---

# First-Time Setup

## Overview

When no EXTEND.md is found, guide user through preference setup.

**⛔ BLOCKING OPERATION**: This setup MUST complete before ANY other workflow steps. Do NOT:
- Ask about reference images
- Ask about content/article
- Ask about type or style preferences
- Proceed to content analysis

ONLY ask the questions in this setup flow, save EXTEND.md, then continue.

## Setup Flow

```
No EXTEND.md found
        │
        ▼
┌─────────────────────┐
│ AskUserQuestion     │
│ (all questions)     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ Create EXTEND.md    │
│ (project root)      │
└─────────────────────┘
        │
        ▼
    Continue to Step 1
```

## Questions

**Language**: Use user's input language or preferred language for all questions. Do not always use English.

Use single AskUserQuestion with multiple questions (AskUserQuestion auto-adds "Other" option):

### Question 1: Watermark

```
header: "Watermark"
question: "Watermark text for generated illustrations? Type your watermark content (e.g., name, @handle)"
options:
  - label: "No watermark (Recommended)"
    description: "No watermark, can enable later in EXTEND.md"
```

Position defaults to bottom-right.

### Question 2: Preferred Style

```
header: "Style"
question: "Default illustration style preference? Or type another style name"
options:
  - label: "None (Recommended)"
    description: "Auto-select based on content analysis"
  - label: "notion"
    description: "Minimalist hand-drawn line art"
  - label: "warm"
    description: "Friendly, approachable, personal"
```

### Question 3: Language

```
header: "Language"
question: "Default language for illustration text elements?"
options:
  - label: "Auto-detect (Recommended)"
    description: "Detect from article content each time"
  - label: "Chinese (zh)"
    description: "Chinese text in illustrations"
  - label: "English (en)"
    description: "English text in illustrations"
```

## Save Location

EXTEND.md is always saved to project root: `EXTEND.md`

## After Setup

1. Write EXTEND.md to project root
2. Confirm: "Preferences saved to EXTEND.md"
3. Continue to Step 1

## EXTEND.md Template

```yaml
---
version: 2
watermark:
  enabled: [true/false]
  content: "[user input or empty]"
  position: bottom-right
  opacity: 0.7
preferred_style:
  name: [selected style or null]
  description: ""
language: null
---
```

## Modifying Preferences Later

Users can edit EXTEND.md directly or run setup again:
- Delete EXTEND.md to trigger setup
- Edit YAML frontmatter for quick changes
- Full schema: `references/config/preferences-schema.md`
