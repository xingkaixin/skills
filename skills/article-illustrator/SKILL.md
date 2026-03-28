---
name: article-illustrator
description: Analyzes article structure, identifies positions requiring visual aids, generates illustration prompts with Type × Style two-dimension approach. Outputs prompt files only — no image generation. Use when user asks to "illustrate article", "add images", "generate images for article", or "为文章配图".
version: 2.0.0

---

# Article Illustrator

Analyze articles, identify illustration positions, generate structured prompts for downstream image generation.

## Two Dimensions

| Dimension | Controls | Examples |
|-----------|----------|----------|
| **Type** | Information structure | infographic, scene, flowchart, comparison, framework, timeline |
| **Style** | Visual aesthetics | notion, warm, minimal, blueprint, watercolor, elegant |

Combine freely: `--type infographic --style blueprint`

Or use presets: `--preset tech-explainer` → type + style in one flag. See [Style Presets](references/style-presets.md).

## Types

| Type | Best For |
|------|----------|
| `infographic` | Data, metrics, technical |
| `scene` | Narratives, emotional |
| `flowchart` | Processes, workflows |
| `comparison` | Side-by-side, options |
| `framework` | Models, architecture |
| `timeline` | History, evolution |

## Styles

See [references/styles.md](references/styles.md) for Core Styles, full gallery, and Type × Style compatibility.

## Workflow

```
Article Illustrator Progress:
- [ ] Step 0: Check EXTEND.md ⛔ BLOCKING
- [ ] Step 1: Analyze content + save refs
- [ ] Step 2: Confirm settings ⚠️
- [ ] Step 3: Generate outline
- [ ] Step 4: Create prompt files
- [ ] Step 5: Completion report
```

### Step 0: Load EXTEND.md ⛔ BLOCKING

Check EXTEND.md in project root only:
```bash
test -f EXTEND.md && echo "found"
```

| Result | Action |
|--------|--------|
| Found | Read, parse, display summary → Continue |
| Not found | ⛔ Run [first-time-setup](references/config/first-time-setup.md) |

Full procedures: [references/workflow.md](references/workflow.md#step-0-load-extendmd)

### Step 1: Analyze Content

| Analysis | Output |
|----------|--------|
| Content type | Technical / Tutorial / Methodology / Narrative |
| Purpose | information / visualization / imagination |
| Core arguments | 2-5 main points |
| Positions | Where illustrations add value |

**CRITICAL**: Metaphors → visualize underlying concept, NOT literal image.

Full procedures: [references/workflow.md](references/workflow.md#step-1-analyze-content)

### Step 2: Confirm Settings ⚠️

**ONE AskUserQuestion, max 4 Qs. Q1-Q2 REQUIRED.**

| Q | Options |
|---|---------|
| **Q1: Preset or Type** | [Recommended preset], [alt preset], or manual: infographic, scene, flowchart, comparison, framework, timeline, mixed |
| **Q2: Density** | minimal (1-2), balanced (3-5), per-section (Recommended), rich (6+) |
| **Q3: Style** | [Recommended], minimal-flat, sci-fi, hand-drawn, editorial, scene, poster, Other — **skip if preset chosen** |
| Q4: Language | When article language ≠ EXTEND.md setting |

Full procedures: [references/workflow.md](references/workflow.md#step-2-confirm-settings)

### Step 3: Generate Outline

Save `outline.md` with frontmatter (type, density, style, image_count) and entries:

```yaml
## Illustration 1
**Position**: [section/paragraph]
**Purpose**: [why]
**Visual Content**: [what]
**Filename**: illustration-01.md
```

Full template: [references/workflow.md](references/workflow.md#step-3-generate-outline)

### Step 4: Create Prompt Files

**Output**: One `illustration-{NN}.md` file per illustration, in the same directory as the article.

Each file contains:
- YAML frontmatter (type, style, references)
- Content Context (title, summary, keywords)
- Visual Design (type, style, aspect, language)
- Illustration Prompt (structured prompt)
- Rendering Notes (style characteristics)
- Reference Style (if reference images provided)

Full template: [references/prompt-construction.md](references/prompt-construction.md)

### Step 5: Completion Report

```
Article Illustration Prompts Ready!

Article: [path]
Type: [type] | Density: [level] | Style: [style]

Prompt Files:
✓ illustration-01.md
✓ illustration-02.md

Next Steps:
1. Use illustration prompts with your preferred image generation tool
2. Generated images will be saved alongside the prompts
3. Reference in article with: ![description](illustration-{NN}.png)
```

## File Structure

Prompt files are saved in the same directory as the article:

```
{article-dir}/
├── article.md
├── outline.md
├── illustration-01.md
├── illustration-02.md
└── refs/
    └── ref-01-{slug}.png
```

**Filename conflict**: If `illustration-{NN}.md` exists, append `-1`, `-2`, etc.

## Modification

| Action | Steps |
|--------|-------|
| Edit | Update prompt file → Regenerate image |
| Add | Position → Prompt → Insert reference |
| Delete | Delete files → Remove reference → Update outline |

## References

| File | Content |
|------|---------|
| [references/workflow.md](references/workflow.md) | Detailed procedures |
| [references/usage.md](references/usage.md) | Command syntax |
| [references/styles.md](references/styles.md) | Style gallery |
| [references/style-presets.md](references/style-presets.md) | Preset shortcuts (type + style) |
| [references/prompt-construction.md](references/prompt-construction.md) | Prompt templates |
| [references/config/first-time-setup.md](references/config/first-time-setup.md) | First-time setup |
