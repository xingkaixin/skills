---
name: preferences-schema
description: EXTEND.md YAML schema for baoyu-article-illustrator user preferences
---

# Preferences Schema

## Full Schema

```yaml
---
version: 2

watermark:
  enabled: false
  content: ""
  position: bottom-right  # bottom-right|bottom-left|bottom-center|top-right

preferred_style:
  name: null              # Style name or null for auto-select
  description: ""         # Override/notes

language: null            # zh|en|ja|ko|auto (null = auto-detect)
---
```

## Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | int | 2 | Schema version |
| `watermark.enabled` | bool | false | Enable watermark |
| `watermark.content` | string | "" | Watermark text (@username or custom) |
| `watermark.position` | enum | bottom-right | Position on image |
| `preferred_style.name` | string | null | Style name or null |
| `preferred_style.description` | string | "" | Custom notes/override |
| `language` | string | null | Output language (null = auto-detect) |

## Position Options

| Value | Description |
|-------|-------------|
| `bottom-right` | Lower right corner (default, most common) |
| `bottom-left` | Lower left corner |
| `bottom-center` | Bottom center |
| `top-right` | Upper right corner |

## Example: Minimal Preferences

```yaml
---
version: 2
watermark:
  enabled: true
  content: "@myusername"
preferred_style:
  name: notion
---
```

## Example: Full Preferences

```yaml
---
version: 2
watermark:
  enabled: true
  content: "@myaccount"
  position: bottom-right

preferred_style:
  name: notion
  description: "Clean illustrations for tech articles"

language: zh
---
```

## Migration from v1

| v1 Field | v2 Action |
|----------|-----------|
| `version: 1` | `version: 2` |
| `default_output_dir` | Removed (output is always same-dir as article) |
| `custom_styles` | Removed |
| (new) | `language` field added |
