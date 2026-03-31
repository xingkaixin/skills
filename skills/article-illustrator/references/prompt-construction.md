# Prompt Construction

## Output File Format

Each illustration outputs one `illustration-{NN}.md` file in the same directory as the article:

```
{article-dir}/
├── article.md
├── outline.md
├── illustration-01.md
├── illustration-02.md
└── refs/
    └── ref-01-{slug}.png
```

## Prompt File Format

```yaml
---
type: infographic
style: blueprint
references:                    # ⚠️ ONLY if files EXIST in refs/ directory
  - ref_id: 01
    filename: refs/ref-01-{slug}.{ext}
    usage: direct              # direct | style | palette
---

# Content Context
Article title: [标题]
Content summary: [摘要]
Keywords: [关键词]

# Visual Design
Type: [confirmed type]
Style: [confirmed style]
Aspect ratio: 16:9
Language: [confirmed language]

# Illustration Prompt
[Complete prompt for image generation, see templates below]

# Rendering Notes
[Key characteristics from the selected style definition]

# Reference Style — MUST INCORPORATE（如有引用图片）
[If references provided, detailed description per reference-images.md]
```

**⚠️ CRITICAL - When to include `references` field**:

| Situation | Action |
|-----------|--------|
| Reference file saved to `refs/` | Include in frontmatter ✓ |
| Style extracted verbally (no file) | DO NOT include in frontmatter, append to prompt body instead |
| File path in frontmatter but file doesn't exist | ERROR - remove references field |

**Reference Usage Types** (only when file exists):

| Usage | Description | Generation Action |
|-------|-------------|-------------------|
| `direct` | Primary visual reference | Pass to `--ref` parameter |
| `style` | Style characteristics only | Describe style in prompt text |
| `palette` | Color palette extraction | Include colors in prompt |

**If no reference file but style/palette extracted verbally**, append directly to prompt body under "Reference Style — MUST INCORPORATE":
```
COLORS (extracted):
- Primary: #E8756D coral
- Secondary: #7ECFC0 mint
...

STYLE (extracted):
- Clean lines, minimal shadows
- Gradient backgrounds
...
```

---

## Default Composition Requirements

**Apply to ALL prompts by default**:

| Requirement | Description |
|-------------|-------------|
| **Clean composition** | Simple layouts, no visual clutter |
| **White space** | Generous margins, breathing room around elements |
| **No complex backgrounds** | Solid colors or subtle gradients only, avoid busy textures |
| **Centered or content-appropriate** | Main visual elements centered or positioned by content needs |
| **Matching graphics** | Use graphic elements that align with content theme |
| **Highlight core info** | White space draws attention to key information |

**Add to ALL prompts**:
> Clean composition with generous white space. Simple or no background. Main elements centered or positioned by content needs.

---

## Character Rendering

When depicting people:

| Guideline | Description |
|-----------|-------------|
| **Style** | Simplified cartoon silhouettes or symbolic expressions |
| **Avoid** | Realistic human portrayals, detailed faces |
| **Diversity** | Varied body types when showing multiple people |
| **Emotion** | Express through posture and simple gestures |

**Add to ALL prompts with human figures**:
> Human figures: simplified stylized silhouettes or symbolic representations, not photorealistic.

---

## Text in Illustrations

| Element | Guideline |
|---------|-----------|
| **Size** | Large, prominent, immediately readable |
| **Style** | Handwritten fonts preferred for warmth |
| **Content** | Concise keywords and core concepts only |
| **Language** | Match article language |

**Add to prompts with text**:
> Text should be large and prominent with handwritten-style fonts. Keep minimal, focus on keywords.

---

## Principles

Good prompts must include:

1. **Layout Structure First**: Describe composition, zones, flow direction
2. **Specific Data/Labels**: Use actual numbers, terms from article
3. **Visual Relationships**: How elements connect
4. **Semantic Colors**: Meaning-based color choices (red=warning, green=efficient)
5. **Style Characteristics**: Line treatment, texture, mood
6. **Aspect Ratio**: End with ratio and complexity level

## Type-Specific Templates

### Infographic

```
# Illustration Prompt
[Title] - Data Visualization

Layout: [grid/radial/hierarchical]

ZONES:
- Zone 1: [data point with specific values]
- Zone 2: [comparison with metrics]
- Zone 3: [summary/conclusion]

LABELS: [specific numbers, percentages, terms from article]
COLORS: [semantic color mapping]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Infographic + vector-illustration**:
```
Flat vector illustration infographic. Clean black outlines on all elements.
COLORS: Cream background (#F5F0E6), Coral Red (#E07A5F), Mint Green (#81B29A), Mustard Yellow (#F2CC8F)
ELEMENTS: Geometric simplified icons, no gradients, playful decorative elements (dots, stars)
```

### Scene

```
# Illustration Prompt
[Title] - Atmospheric Scene

FOCAL POINT: [main subject]
ATMOSPHERE: [lighting, mood, environment]
MOOD: [emotion to convey]
COLOR TEMPERATURE: [warm/cool/neutral]
STYLE: [style characteristics]
ASPECT: 16:9
```

### Flowchart

```
# Illustration Prompt
[Title] - Process Flow

Layout: [left-right/top-down/circular]

STEPS:
1. [Step name] - [brief description]
2. [Step name] - [brief description]
...

CONNECTIONS: [arrow types, decision points]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Flowchart + vector-illustration**:
```
Flat vector flowchart with bold arrows and geometric step containers.
COLORS: Cream background (#F5F0E6), steps in Coral/Mint/Mustard, black outlines
ELEMENTS: Rounded rectangles, thick arrows, simple icons per step
```

### Comparison

```
# Illustration Prompt
[Title] - Comparison View

LEFT SIDE - [Option A]:
- [Point 1]
- [Point 2]

RIGHT SIDE - [Option B]:
- [Point 1]
- [Point 2]

DIVIDER: [visual separator]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Comparison + vector-illustration**:
```
Flat vector comparison with split layout. Clear visual separation.
COLORS: Left side Coral (#E07A5F), Right side Mint (#81B29A), cream background
ELEMENTS: Bold icons, black outlines, centered divider line
```

### Framework

```
# Illustration Prompt
[Title] - Conceptual Framework

STRUCTURE: [hierarchical/network/matrix]

NODES:
- [Concept 1] - [role]
- [Concept 2] - [role]

RELATIONSHIPS: [how nodes connect]
STYLE: [style characteristics]
ASPECT: 16:9
```

**Framework + vector-illustration**:
```
Flat vector framework diagram with geometric nodes and bold connectors.
COLORS: Cream background (#F5F0E6), nodes in Coral/Mint/Mustard/Blue, black outlines
ELEMENTS: Rounded rectangles or circles for nodes, thick connecting lines
```

### Timeline

```
# Illustration Prompt
[Title] - Chronological View

DIRECTION: [horizontal/vertical]

EVENTS:
- [Date/Period 1]: [milestone]
- [Date/Period 2]: [milestone]

MARKERS: [visual indicators]
STYLE: [style characteristics]
ASPECT: 16:9
```

### Line-Sketch Style Override

When `style: line-sketch`, replace standard style instructions with:

```
Minimal hand-drawn line sketch illustration. Off-white paper background (#F5F3EE). Dark gray sketch lines (#3A3A3A), single weight, slight natural tremor.
COLORS: Gray-scale only + umbrella yellow (#D4A843) as ONE accent — use sparingly on the single most important element.
FIGURES: Faceless round-headed human figures ONLY. Express emotion through posture and position, not facial expression.
COMPOSITION: Single focal point, 60%+ negative space, conceptual not literal.
QUOTE: Add one short Chinese quote in natural handwritten style near the bottom.
RESTRICTIONS: No realism, no 3D, no painterly texture, no high saturation, no complex background, no photographic detail.
LANGUAGE: Use Chinese wherever possible for any visible text.
```

**Scene + line-sketch**:
```
Single conceptual scene with one round-headed faceless figure. Sparse composition, mostly empty paper.
ACCENT: Umbrella yellow (#D4A843) on ONE key object only (e.g., an umbrella, a door, a lamp).
MOOD: Restrained, lucid, slightly ironic, emotionally calm.
QUOTE: One short Chinese handwritten quote at bottom (e.g., "有些事想清楚了，反而不想说了。")
```

---

### Screen-Print Style Override

When `style: screen-print`, replace standard style instructions with:

```
Screen print / silkscreen poster art. Flat color blocks, NO gradients.
COLORS: 2-5 colors maximum. [Choose from style palette or duotone pair]
TEXTURE: Halftone dot patterns, slight color layer misregistration, paper grain
COMPOSITION: Bold silhouettes, geometric framing, negative space as storytelling element
FIGURES: Silhouettes only, no detailed faces, stencil-cut edges
TYPOGRAPHY: Bold condensed sans-serif integrated into composition (not overlaid)
```

**Scene + screen-print**:
```
Conceptual poster scene. Single symbolic focal point, NOT literal illustration.
COLORS: Duotone pair (e.g., Burnt Orange #E8751A + Deep Teal #0A6E6E) on Off-Black #121212
COMPOSITION: Centered silhouette or geometric frame, 60%+ negative space
TEXTURE: Halftone dots, paper grain, slight print misregistration
```

**Comparison + screen-print**:
```
Split poster composition. Each side dominated by one color from duotone pair.
LEFT: [Color A] side with silhouette/icon for [Option A]
RIGHT: [Color B] side with silhouette/icon for [Option B]
DIVIDER: Geometric shape or negative space boundary
TEXTURE: Halftone transitions between sides
```

---

## What to Avoid

- Vague descriptions ("a nice image")
- Literal metaphor illustrations
- Missing concrete labels/annotations
- Generic decorative elements

## Watermark Integration

If watermark enabled in preferences, append to "Illustration Prompt":

```
Include a subtle watermark "[content]" positioned at [position].
```

## Reference Image Handling

Full details: [workflow.md#step-1-pre-check](workflow.md#step-1-pre-check)
