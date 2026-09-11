# Usage

## Command Syntax

```bash
# Auto-select type and style based on content
/article-illustrator path/to/article.md

# Specify type
/article-illustrator path/to/article.md --type infographic

# Specify style
/article-illustrator path/to/article.md --style blueprint

# Combine type and style
/article-illustrator path/to/article.md --type flowchart --style notion

# Override palette without changing style
/article-illustrator path/to/article.md --style vector-illustration --palette macaron

# Specify density
/article-illustrator path/to/article.md --density rich

# Direct content input (paste mode)
/article-illustrator
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--type <name>` | Illustration type (see Type Gallery in SKILL.md) |
| `--style <name>` | Visual style (see references/styles.md) |
| `--palette <name>` | Override style colors: macaron / warm / neon / mono-ink |
| `--preset <name>` | Shorthand for type + style + optional palette combo (see [style-presets.md](style-presets.md)) |
| `--density <level>` | Image count: minimal / balanced / per-section / rich |

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
/article-illustrator api-design.md --type infographic --style blueprint
```

**Same thing with preset**:
```bash
/article-illustrator api-design.md --preset tech-explainer
```

**Personal story**:
```bash
/article-illustrator journey.md --preset storytelling
```

**Tutorial with steps**:
```bash
/article-illustrator how-to-deploy.md --preset tutorial --density rich
```

**Opinion article with poster style**:
```bash
/article-illustrator opinion.md --preset opinion-piece
```

**Preset with override**:
```bash
/article-illustrator article.md --preset tech-explainer --style notion
```
