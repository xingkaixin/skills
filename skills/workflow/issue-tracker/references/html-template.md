# HTML Generation Workflow

Issue HTML is a handcrafted visual document generated from the issue's Markdown content. It should follow `../DESIGN.md`; this file defines the workflow and output constraints.

## Output

Write the result to:

```text
{issue-directory}/design.html
```

The file must be a single standalone HTML document with inline CSS. External dependencies are limited to fonts and Mermaid if the source content includes Mermaid diagrams.

## Inputs

Read, in this order:

1. `meta.yaml` for title, issue id, status, priority, labels, PRs, and dates.
2. `design.md` as the primary content source.
3. `notes.md` if implementation notes affect the current visual summary.
4. `discussion.md` only when user/team decisions materially change the rendered design.

## Workflow

1. Extract the issue's major sections and decide which sections deserve visual treatment.
2. Choose one primary accent from `DESIGN.md` based on the issue domain.
3. Map each content type to an appropriate visual component: flow, pipeline, type cards, table, callout, compare grid, prompt cards, or checklist.
4. Write the HTML directly. Do not use the bundled markdown converter pattern or a generic article template.
5. Preserve important technical details from the Markdown, especially file paths, APIs, types, invariants, risks, and validation steps.
6. Add sticky section nav when there is more than one major visual section.
7. Include small JS only for nav scrolling / active state, and Mermaid initialization only when needed.

## Required Metadata Treatment

Render issue metadata compactly near the top, not as a dominant card:

- issue id
- status
- priority
- type
- milestone or assignee when present
- labels when present
- PR links when present

Status and priority should use small badges or inline metadata, not large panels.

## Constraints

- Light theme only.
- Responsive on desktop and mobile.
- No decorative gradients, background blobs, or marketing-style hero sections.
- Do not invent visual sections that are not supported by source content.
- Do not alter source issue files while generating HTML unless the user explicitly asks.
- If `design.md` is too thin to support a rich visual page, produce a restrained readable page instead of fabricating structure.
