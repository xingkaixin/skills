# Usage

## Command Syntax

```bash
# Auto-select type and style based on content
/baoyu-article-illustrator path/to/article.md

# Specify type
/baoyu-article-illustrator path/to/article.md --type infographic

# Specify style
/baoyu-article-illustrator path/to/article.md --style blueprint

# Combine type and style
/baoyu-article-illustrator path/to/article.md --type flowchart --style notion

# Specify density
/baoyu-article-illustrator path/to/article.md --density rich

# Direct content input (paste mode)
/baoyu-article-illustrator
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--type <name>` | Illustration type (see Type Gallery in SKILL.md) |
| `--style <name>` | Visual style (see references/styles.md) |
| `--preset <name>` | Shorthand for type + style combo (see [references/style-presets.md](references/style-presets.md)) |
| `--density <level>` | Image count: minimal / balanced / rich |

## Input Modes

| Mode | Trigger | Output |
|------|---------|--------|
| File path | `path/to/article.md` | Prompt files in same directory as article |
| Paste content | No path argument | Prompt files in current working directory |

## Output

This skill generates **illustration prompt files** only — no images are generated directly.

Output files:
- `outline.md` — Illustration plan
- `illustration-01.md` — Prompt for first illustration
- `illustration-02.md` — Prompt for second illustration
- etc.

Use the prompt files with your preferred image generation tool.

## Examples

**Technical article with data**:
```bash
/baoyu-article-illustrator api-design.md --type infographic --style blueprint
```

**Same thing with preset**:
```bash
/baoyu-article-illustrator api-design.md --preset tech-explainer
```

**Personal story**:
```bash
/baoyu-article-illustrator journey.md --preset storytelling
```

**Tutorial with steps**:
```bash
/baoyu-article-illustrator how-to-deploy.md --preset tutorial --density rich
```

**Opinion article with poster style**:
```bash
/baoyu-article-illustrator opinion.md --preset opinion-piece
```

**Preset with override**:
```bash
/baoyu-article-illustrator article.md --preset tech-explainer --style notion
```
