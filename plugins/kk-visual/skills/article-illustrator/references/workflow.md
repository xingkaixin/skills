# Detailed Workflow Procedures

## Progress Checklist

```
Article Illustrator Progress:
- [ ] Step 0: Check EXTEND.md ⛔ BLOCKING
- [ ] Step 1: Analyze content + save refs
- [ ] Step 2: Confirm settings ⚠️
- [ ] Step 3: Generate outline
- [ ] Step 4: Create prompt files
- [ ] Step 5: Completion report
```

## Flow

```
Input → [Step 0: EXTEND.md] ─┬─ Found → Continue
                             └─ Not found → First-Time Setup ⛔ BLOCKING → Save EXTEND.md → Continue
        ↓
Analyze + Save Refs → [Confirm: Type, Density, Style] → Outline → Prompts → Complete
```

---

## Step 0: Load EXTEND.md ⛔ BLOCKING

**CRITICAL**: If EXTEND.md not found, MUST complete first-time setup before ANY other questions or steps. Do NOT proceed to reference images, do NOT ask about content, do NOT ask about type/style — ONLY complete the preferences setup first.

Check EXTEND.md in project root only:
```bash
test -f EXTEND.md && echo "found"
```

| Result | Action |
|--------|--------|
| Found | Read, parse, display summary → Continue |
| Not found | ⛔ **BLOCKING**: Run first-time setup ONLY ([config/first-time-setup.md](config/first-time-setup.md)) → Complete and save EXTEND.md → Then continue |

**Supports**: Watermark | Preferred style | Language

---

## Step 1: Analyze Content + Save References

### 1.0 Save Reference Images ⚠️ REQUIRED if images provided

Check if user provided reference images. Handle based on input type:

| Input Type | Action |
|------------|--------|
| Image file path provided | Copy to `refs/` subdirectory → can use `--ref` |
| Image in conversation (no path) | **ASK user for file path** with AskUserQuestion |
| User can't provide path | Extract style/palette verbally → append to prompts (NO frontmatter references) |

**CRITICAL**: Only add `references` to prompt frontmatter if files are ACTUALLY SAVED to `refs/` directory.

**If user provides file path**:
1. Copy to `refs/NN-ref-{slug}.png`
2. Create description: `refs/NN-ref-{slug}.md`
3. Verify files exist before proceeding

**If user can't provide path** (extracted verbally):
1. Analyze image visually, extract: colors, style, composition
2. Create `refs/extracted-style.md` with extracted info
3. DO NOT add `references` to prompt frontmatter
4. Instead, append extracted style/colors directly to prompt text

**Description File Format** (only when file saved):
```yaml
---
ref_id: NN
filename: NN-ref-{slug}.png
---
[User's description or auto-generated description]
```

**Verification** (only for saved files):
```
Reference Images Saved:
- 01-ref-{slug}.png ✓ (can use --ref)
- 02-ref-{slug}.png ✓ (can use --ref)
```

**Or for extracted style**:
```
Reference Style Extracted (no file):
- Colors: #E8756D coral, #7ECFC0 mint...
- Style: minimal flat vector, clean lines...
→ Will append to prompt text (not --ref)
```

---

### 1.1 Analyze Content

| Analysis | Description |
|----------|-------------|
| Content type | Technical / Tutorial / Methodology / Narrative |
| Illustration purpose | information / visualization / imagination |
| Core arguments | 2-5 main points to visualize |
| Visual opportunities | Positions where illustrations add value |
| Recommended type | Based on content signals and purpose |
| Recommended density | Based on length and complexity |

### 1.2 Extract Core Arguments

- Main thesis
- Key concepts reader needs
- Comparisons/contrasts
- Framework/model proposed

**CRITICAL**: If article uses metaphors (e.g., "电锯切西瓜"), do NOT illustrate literally. Visualize the **underlying concept**.

### 1.3 Identify Positions

**Illustrate**:
- Core arguments (REQUIRED)
- Abstract concepts
- Data comparisons
- Processes, workflows

**Do NOT Illustrate**:
- Metaphors literally
- Decorative scenes
- Generic illustrations

### 1.4 Analyze Reference Images (if provided in Step 1.0)

For each reference image:

| Analysis | Description |
|----------|-------------|
| Visual characteristics | Style, colors, composition |
| Content/subject | What the reference depicts |
| Suitable positions | Which sections match this reference |
| Style match | Which illustration types/styles align |
| Usage recommendation | `direct` / `style` / `palette` |

| Usage | When to Use |
|-------|-------------|
| `direct` | Reference matches desired output closely |
| `style` | Extract visual style characteristics only |
| `palette` | Extract color scheme only |

---

## Step 2: Confirm Settings ⚠️

**Do NOT skip.** Use ONE AskUserQuestion call with max 4 questions. **Q1, Q2 are REQUIRED.**

### Q1: Preset or Type ⚠️ REQUIRED

Based on Step 1 content analysis, recommend a preset first (sets both type & style). Look up [style-presets.md](style-presets.md) "Content Type → Preset Recommendations" table.

- [Recommended preset] — [brief: type + style + why] (Recommended)
- [Alternative preset] — [brief]
- Or choose type manually: infographic / scene / flowchart / comparison / framework / timeline / mixed

**If user picks a preset → skip Q3** (type & style both resolved).
**If user picks a type → Q3 is REQUIRED.**

### Q2: Density ⚠️ REQUIRED - DO NOT SKIP
- minimal (1-2) - Core concepts only
- balanced (3-5) - Major sections
- per-section - At least 1 per section/chapter (Recommended)
- rich (6+) - Comprehensive coverage

### Q3: Style ⚠️ REQUIRED (skip if preset chosen in Q1)

If EXTEND.md has `preferred_style`:
- [Custom style name + brief description] (Recommended)
- [Top compatible core style 1]
- [Top compatible core style 2]
- Other (see full Style Gallery)

If no `preferred_style` (present Core Styles first):
- [Best compatible core style] (Recommended)
- [Other compatible core style 1]
- [Other compatible core style 2]
- Other (see full Style Gallery)

**Core Styles** (simplified selection):

| Core Style | Maps To | Best For |
|------------|---------|----------|
| `minimal-flat` | notion | General, knowledge sharing, SaaS |
| `sci-fi` | blueprint | AI, frontier tech, system design |
| `hand-drawn` | sketch/warm | Relaxed, reflective, casual |
| `editorial` | editorial | Processes, data, journalism |
| `scene` | warm/watercolor | Narratives, emotional, lifestyle |
| `poster` | screen-print | Opinion, editorial, cultural, cinematic |

Style selection based on Type × Style compatibility matrix (styles.md).
Full specs: `references/styles/<style>.md`

### Q4: Image Text Language ⚠️ REQUIRED when article language ≠ EXTEND.md `language`

Detect article language from content. If different from EXTEND.md `language` setting, MUST ask:
- Article language (match article content) (Recommended)
- EXTEND.md language (user's general preference)

**Skip only if**: Article language matches EXTEND.md `language`, or EXTEND.md has no `language` setting.

### Display Reference Usage (if references detected in Step 1.0)

When presenting outline preview to user, show reference assignments:

```
Reference Images:
| Ref | Filename | Recommended Usage |
|-----|----------|-------------------|
| 01 | 01-ref-diagram.png | direct → Illustration 1, 3 |
| 02 | 02-ref-chart.png | palette → Illustration 2 |
```

---

## Step 3: Generate Outline

Save as `outline.md` in article directory:

```yaml
---
type: infographic
density: balanced
style: blueprint
image_count: 4
references:                    # Only if references provided
  - ref_id: 01
    filename: refs/01-ref-diagram.png
    description: "Technical diagram showing system architecture"
  - ref_id: 02
    filename: refs/02-ref-chart.png
    description: "Color chart with brand palette"
---

## Illustration 1

**Position**: [section] / [paragraph]
**Purpose**: [why this helps]
**Visual Content**: [what to show]
**Type Application**: [how type applies]
**References**: [01]                    # Optional: list ref_ids used
**Reference Usage**: direct             # direct | style | palette
**Filename**: illustration-01.md

## Illustration 2
...
```

**Requirements**:
- Each position justified by content needs
- Type applied consistently
- Style reflected in descriptions
- Count matches density
- References assigned based on Step 1.4 analysis

---

## Step 4: Create Prompt Files

### 4.1 Create Prompt Files ⛔ BLOCKING

**Every illustration MUST have a saved prompt file before completion. DO NOT skip this step.**

For each illustration in the outline:

1. **Create prompt file**: `{article-dir}/illustration-{NN}.md`
2. **Include YAML frontmatter**:
   ```yaml
   ---
   type: infographic
   style: blueprint
   references:                    # ⚠️ ONLY if files EXIST in refs/ directory
     - ref_id: 01
       filename: refs/01-ref-{slug}.png
       usage: direct
   ---
   ```
3. **Follow template** from [prompt-construction.md](prompt-construction.md):
   - Content Context: title, summary, keywords
   - Visual Design: type, style, aspect, language
   - Illustration Prompt: structured prompt content
   - Rendering Notes: style characteristics
   - Reference Style (if applicable)
4. **Apply defaults**: composition requirements, character rendering, text guidelines, watermark

### 4.2 Verify Prompt Files

**⛔ Before proceeding, confirm ALL prompt files exist**:

```
Prompt Files:
- illustration-01.md ✓
- illustration-02.md ✓
...
```

---

## Step 5: Completion Report

```
Article Illustration Prompts Ready!

Article: [path]
Type: [type] | Density: [level] | Style: [style]
Language: [language]

Prompt Files:
✓ illustration-01.md
✓ illustration-02.md

Next Steps:
1. Use illustration prompts with your preferred image generation tool
2. Generated images will be saved alongside the prompts
3. Reference prompts in article with: ![description](illustration-{NN}.png)

Files Location: [article directory]
```

### Insert Placeholder References (optional)

If user wants placeholder image references inserted into the article:

Insert after corresponding paragraph:
```
![description](illustration-{NN}.png)
```

These will be replaced with actual image paths after generation.

---

## Reference Image Handling

### Frontmatter References

**MUST add `references` field in YAML frontmatter** when reference files are saved to `refs/`:

```yaml
---
type: infographic
style: blueprint
references:
  - ref_id: 01
    filename: refs/ref-01-diagram.png
    usage: direct
---
```

| Field | Description |
|-------|-------------|
| `ref_id` | Sequential number (01, 02, ...) |
| `filename` | Relative path from prompt file's parent directory |
| `usage` | `direct` / `style` / `palette` |

**Omit `references` field entirely** if no reference files saved (style extracted verbally only).

### When to Include References in Frontmatter

| Situation | Frontmatter Action | Generation Action |
|-----------|-------------------|-------------------|
| Reference file saved to `refs/` | Add to `references` list ✓ | Pass via `--ref` parameter |
| Style extracted verbally (no file) | Omit `references` field | Describe in prompt body only |
| File path in frontmatter but doesn't exist | ERROR - fix or remove | Generation will fail |

**Before writing prompt with references, verify**: `test -f refs/ref-NN-{slug}.{ext}`

### Processing References

For each illustration with references:

| Usage | Action |
|-------|--------|
| `direct` | Add reference path to `--ref` parameter |
| `style` | Analyze reference, append style traits to prompt |
| `palette` | Extract colors from reference, append to prompt |

### Watermark Application

If watermark enabled in EXTEND.md, append to each prompt:

```
Include a subtle watermark "[content]" positioned at [position].
```
