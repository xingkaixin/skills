# Issue HTML Visual Design

Use this design direction when generating an issue's `design.html` from `design.md`. The output should be a custom visual document shaped by the issue content, not a generic Markdown dump.

## Source Inspiration

The visual language is derived from `docs/annotation-data-flow.html` and `docs/focus-co-reading-data-flow.html`:

- warm paper background with white content surfaces
- restrained typography: serif display headings, sans body, mono code
- sticky horizontal section navigation
- wide desktop canvas, responsive mobile stack
- structured visual blocks for models, flows, decisions, tables, prompts, and checklists
- one primary accent per page, with secondary semantic accents for categories

## Design Tokens

Fonts:

- Display: `Source Serif 4`
- Body: `Noto Sans SC`
- Code: `JetBrains Mono`

Load fonts through Google Fonts unless the target environment cannot access external assets.

Core palette:

```css
:root {
  --bg: #FAFAF7;
  --bg-warm: #F5F3EE;
  --bg-card: #FFFFFF;
  --bg-code: #F0EDE6;
  --text-primary: #1A1A18;
  --text-secondary: #5C5B56;
  --text-tertiary: #8E8D88;
  --border: #E2DFD6;
  --border-light: #EDEAE2;
  --accent-blue: #2563EB;
  --accent-blue-light: #EFF6FF;
  --accent-orange: #EA580C;
  --accent-orange-light: #FFF7ED;
  --accent-green: #16A34A;
  --accent-green-light: #F0FDF4;
  --accent-purple: #7C3AED;
  --accent-purple-light: #F5F3FF;
  --accent-rose: #E11D48;
  --accent-rose-light: #FFF1F2;
  --accent-amber: #D97706;
  --accent-amber-light: #FFFBEB;
  --accent-teal: #0D9488;
  --accent-teal-light: #F0FDFA;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --radius: 10px;
  --radius-sm: 6px;
}
```

Choose one primary accent for the issue based on its domain:

- desktop, IPC, storage, architecture: blue
- AI, prompt, agent orchestration: purple
- reader, EPUB, content flow: teal
- bugs, risks, destructive actions: rose
- migration, cleanup, performance: amber or orange
- completed or validation-heavy docs: green

## Page Structure

Use this skeleton, but customize sections and components to the markdown content:

1. Header: centered issue title, short subtitle, primary accent underline.
2. Sticky nav: one button per major section, generated from the visual sections.
3. Main container: max width around `1120px`, horizontal padding `32px`, mobile `16px`.
4. Sections: `56px` top spacing, small uppercase label, serif `h2`, concise description.
5. Footer: small generated metadata only if useful.

Do not wrap the whole document in one large article card. Use full-width page background and individual cards only for repeated or framed information.

## Content Mapping

Start from the original `design.md`, identify its information types, then choose components:

- Type definitions, schemas, important fields: `type-grid` with `type-card` and field rows.
- Sequential process: `pipeline-card` with numbered `step-row` items and vertical connectors.
- High-level lifecycle: horizontal `flow-container` with `flow-step` nodes and arrows.
- API lists, IPC channels, storage fields: compact table inside `ipc-table-wrap`.
- Tradeoffs, alternatives, branching decisions: two-column compare or merge diagram.
- Risks, constraints, invariants: callout blocks with semantic accent.
- Prompt inputs/outputs or config groups: `prompt-grid` cards.
- Acceptance criteria or validation: `checklist-grid` with numbered check items.

Prefer transforming dense markdown into scannable visual groups. Preserve technical accuracy and all critical details, but merge repetitive prose where it improves comprehension.

## Component Rules

- Cards use `10px` radius, `1px` light border, and `shadow-sm`; hover can lift subtly.
- Tables use warm header backgrounds, compact rows, and mono styling for identifiers.
- Inline code uses warm code background and the page primary accent.
- Avoid decorative gradients and generic hero layouts.
- Keep icons meaningful and sparse. Emoji are acceptable in generated standalone docs when they clarify section type; do not use them as decoration.
- Section nav should update active state with `IntersectionObserver` and smooth-scroll on click.
- The generated HTML should be self-contained except font/CDN scripts required for Mermaid.

## Responsive Rules

- At `max-width: 720px`, collapse grids to one column.
- Keep horizontal flow diagrams scrollable instead of compressing labels until unreadable.
- Reduce header title to about `24px`; keep body text at readable fixed sizes.
- Ensure long code, channel names, and file paths wrap or scroll without overlapping.

## Generation Principles

- Do not use a generic Markdown-to-HTML script as the final output.
- Do not paste the raw markdown into a generic article template.
- Build a custom static HTML page whose structure is derived from the issue's actual content.
- The page may omit low-value prose from `design.md` only when the same information is represented more clearly in a visual component.
- Do not invent facts, file paths, APIs, statuses, or decisions not present in `meta.yaml`, `design.md`, `discussion.md`, or `notes.md`.
