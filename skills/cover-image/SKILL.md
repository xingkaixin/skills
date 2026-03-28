---
name: cover-image
description: Generates cover image prompts for articles with 5 dimensions (type, palette, rendering, text, mood) combining 10 color palettes and 7 rendering styles. Outputs a structured prompt file for downstream image generation. Use when user asks to "generate cover image prompt" or "create cover prompt".
version: 1.56.1

---

# Cover Image Prompt Generator

Generate structured prompts for article cover images with 5-dimensional customization.

## Usage

```bash
# Auto-select dimensions based on content
/cover-image path/to/article.md

# Quick mode: skip confirmation
/cover-image article.md --quick

# Specify dimensions
/cover-image article.md --type conceptual --palette warm --rendering flat-vector

# Style presets (shorthand for palette + rendering)
/cover-image article.md --style blueprint

# With reference images
/cover-image article.md --ref style-ref.png

# Direct content input
/cover-image --palette mono --aspect 1:1 --quick
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--type <name>` | hero, conceptual, typography, metaphor, scene, minimal |
| `--palette <name>` | warm, elegant, cool, dark, earth, vivid, pastel, mono, retro, duotone |
| `--rendering <name>` | flat-vector, hand-drawn, painterly, digital, pixel, chalk, screen-print |
| `--style <name>` | Preset shorthand (see [Style Presets](references/style-presets.md)) |
| `--text <level>` | none, title-only, title-subtitle, text-rich |
| `--mood <level>` | subtle, balanced, bold |
| `--font <name>` | clean, handwritten, serif, display |
| `--aspect <ratio>` | 16:9 (default), 2.35:1, 4:3, 3:2, 1:1, 3:4 |
| `--lang <code>` | Title language (en, zh, ja, etc.) |
| `--no-title` | Alias for `--text none` |
| `--quick` | Skip confirmation, use auto-selection |
| `--ref <files...>` | Reference images for style/composition guidance |

## Five Dimensions

| Dimension | Values | Default |
|-----------|--------|---------|
| **Type** | hero, conceptual, typography, metaphor, scene, minimal | auto |
| **Palette** | warm, elegant, cool, dark, earth, vivid, pastel, mono, retro, duotone | auto |
| **Rendering** | flat-vector, hand-drawn, painterly, digital, pixel, chalk, screen-print | auto |
| **Text** | none, title-only, title-subtitle, text-rich | title-only |
| **Mood** | subtle, balanced, bold | balanced |
| **Font** | clean, handwritten, serif, display | clean |

Auto-selection rules: [references/auto-selection.md](references/auto-selection.md)

## Galleries

**Types**: hero, conceptual, typography, metaphor, scene, minimal
→ Details: [references/types.md](references/types.md)

**Palettes**: warm, elegant, cool, dark, earth, vivid, pastel, mono, retro, duotone
→ Details: [references/palettes/](references/palettes/)

**Renderings**: flat-vector, hand-drawn, painterly, digital, pixel, chalk, screen-print
→ Details: [references/renderings/](references/renderings/)

**Text Levels**: none (pure visual) | title-only (default) | title-subtitle | text-rich (with tags)
→ Details: [references/dimensions/text.md](references/dimensions/text.md)

**Mood Levels**: subtle (low contrast) | balanced (default) | bold (high contrast)
→ Details: [references/dimensions/mood.md](references/dimensions/mood.md)

**Fonts**: clean (sans-serif) | handwritten | serif | display (bold decorative)
→ Details: [references/dimensions/font.md](references/dimensions/font.md)

## File Structure

Cover prompt is generated in the same directory as the article. Do NOT copy articles to other directories.

```
{article-dir}/
├── article.md             # Original article (not copied)
├── cover.md               # Generated prompt
├── cover-1.md             # Conflict variant (if cover.md exists)
├── refs/                  # Reference images (if provided)
│   ├── ref-01-{slug}.{ext}
│   └── ref-01-{slug}.md   # Description file
└── ...
```

**Cover filename**: `cover.md`. If exists: `cover-1.md`, `cover-2.md`, etc.

For direct content input (no article file): generate in current working directory.

## Workflow

### Progress Checklist

```
Cover Image Progress:
- [ ] Step 0: Check preferences (EXTEND.md) ⛔ BLOCKING
- [ ] Step 1: Analyze content + save refs
- [ ] Step 2: Confirm options (6 dimensions) ⚠️ unless --quick
- [ ] Step 3: Create prompt
- [ ] Step 4: Completion report
```

### Flow

```
Input → [Step 0: Preferences] ─┬─ Found → Continue
                               └─ Not found → First-Time Setup ⛔ BLOCKING → Save EXTEND.md → Continue
        ↓
Analyze + Save Refs → [Confirm: 6 Dimensions] → Prompt → Complete
                                              ↓
                                     (skip if --quick or all specified)
```

### Step 0: Load Preferences ⛔ BLOCKING

Check EXTEND.md in project root only:
```bash
test -f EXTEND.md && echo "found"
```

| Result | Action |
|--------|--------|
| Found | Load, display summary → Continue |
| Not found | Ask user for preferences → Generate EXTEND.md → Continue |

**CRITICAL**: If not found, complete setup BEFORE any other steps or questions. Do NOT check other directories.

### Step 1: Analyze Content

1. **Save reference images** (if provided) → [references/workflow/reference-images.md](references/workflow/reference-images.md)
2. **Analyze content**: topic, tone, keywords, visual metaphors
3. **Deep analyze references** ⚠️: Extract specific, concrete elements (see reference-images.md)
4. **Detect language**: Compare source, user input, EXTEND.md preference

**⚠️ People in Reference Images — MUST follow all 3 rules:**

If reference images contain **people** who should appear in the cover:

1. **`usage: direct`** — MUST set in refs description file. NEVER use `style` or `palette` when people need to appear
2. **Per-character description** — MUST describe each person's distinctive features (hair, glasses, skin tone, clothing) in `refs/ref-NN-{slug}.md`. Vague descriptions like "a man" will fail
3. **Prompt inclusion** — MUST include reference image paths in prompt frontmatter `references` list so the downstream image generator can access them

See [reference-images.md § Character Analysis](references/workflow/reference-images.md) for description format.

### Step 2: Confirm Options ⚠️

**MUST use `AskUserQuestion` tool** to present options as interactive selection — NOT plain text tables. Present up to 4 questions in a single `AskUserQuestion` call (Type, Palette, Rendering, Font + Settings). Each question shows the recommended option first with reason, followed by alternatives.

Full confirmation flow and question format: [references/workflow/confirm-options.md](references/workflow/confirm-options.md)

| Condition | Skipped | Still Asked |
|-----------|---------|-------------|
| `--quick` or `quick_mode: true` | 6 dimensions | Aspect ratio (unless `--aspect`) |
| All 6 + `--aspect` specified | All | None |

### Step 3: Create Prompt

Save to article directory as `cover.md`. Template: [references/workflow/prompt-template.md](references/workflow/prompt-template.md)

**Filename conflict**: If `cover.md` exists, use `cover-1.md`, `cover-2.md`, etc. Check before writing.

**CRITICAL - References in Frontmatter**:
- Files saved to `refs/` → Add to frontmatter `references` list
- Style extracted verbally (no file) → Omit `references`, describe in body
- Before writing → Verify: `test -f refs/ref-NN-{slug}.{ext}`

**Reference elements in body** MUST be detailed, prefixed with "MUST"/"REQUIRED", with integration approach.

### Step 4: Completion Report

```
Prompt Ready!

Topic: [topic]
Type: [type] | Palette: [palette] | Rendering: [rendering]
Text: [text] | Mood: [mood] | Font: [font] | Aspect: [ratio]
Title: [title or "visual only"]
Language: [lang] | Watermark: [enabled/disabled]
References: [N images or "extracted style" or "none"]
Location: [article directory path]

Files:
✓ cover.md (or cover-N.md)
```

## Composition Principles

- **Whitespace**: 40-60% breathing room
- **Visual anchor**: Main element centered or offset left
- **Characters**: Simplified silhouettes; NO realistic humans
- **Title**: Use exact title from user/source; never invent

## Extension Support

Custom configurations via EXTEND.md. See **Step 0** for paths.

Supports: Watermark | Preferred dimensions | Default aspect | Quick mode | Custom palettes | Language

Schema: [references/config/preferences-schema.md](references/config/preferences-schema.md)

## References

**Dimensions**: [text.md](references/dimensions/text.md) | [mood.md](references/dimensions/mood.md) | [font.md](references/dimensions/font.md)
**Palettes**: [references/palettes/](references/palettes/)
**Renderings**: [references/renderings/](references/renderings/)
**Types**: [references/types.md](references/types.md)
**Auto-Selection**: [references/auto-selection.md](references/auto-selection.md)
**Style Presets**: [references/style-presets.md](references/style-presets.md)
**Compatibility**: [references/compatibility.md](references/compatibility.md)
**Visual Elements**: [references/visual-elements.md](references/visual-elements.md)
**Workflow**: [confirm-options.md](references/workflow/confirm-options.md) | [prompt-template.md](references/workflow/prompt-template.md) | [reference-images.md](references/workflow/reference-images.md)
**Config**: [preferences-schema.md](references/config/preferences-schema.md) | [first-time-setup.md](references/config/first-time-setup.md) | [watermark-guide.md](references/config/watermark-guide.md)
