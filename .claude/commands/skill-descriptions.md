---
description: Author the trilingual display descriptions the web catalog renders
allowed-tools: Bash, Read, Edit, Write
---

Write human-facing display descriptions for skills whose text is missing or out
of date, into `content/skill-descriptions.json`.

## Why this exists

The `description` in each SKILL.md frontmatter is an **agent trigger** — it is
full of "Use when…", "Trigger this when…" phrasing that reads badly to a person
browsing the catalog. The website renders a separate, human-facing summary in
three languages instead. That text cannot be derived from SKILL.md by rule
(translation is not extraction), so it is authored here and committed.

## Steps

1. Run `pnpm descriptions:status` to list the skills that need work. Each entry
   gives the slug, the reason, the `sourceHash` to record, and the SKILL.md path.

2. For each listed skill, read its SKILL.md in full — the frontmatter
   description alone is not enough to understand what the skill actually does.

3. Write the entry into `content/skill-descriptions.json`:

   ```json
   "slug-here": {
     "sourceHash": "<the hash printed by descriptions:status>",
     "en": "…",
     "zh": "…",
     "ja": "…"
   }
   ```

4. Run `pnpm generate:web-data`. It fails until every skill has a complete,
   current entry.

## How to write the text

- **Address a person deciding whether to install it**, not an agent deciding
  whether to load it. Lead with what the skill does for them.
- **Drop every trigger phrase.** No "Use when", no "Trigger this when", no
  keyword lists.
- **One sentence, roughly 100–140 characters.** Long enough to be concrete,
  short enough to fit a card without clipping and to survive as a meta
  description.
- **Be concrete about the payoff.** "Reviews a CLI for agent usability" beats
  "helps with command-line interfaces".
- **The three locales are not translations of each other.** Write each in
  idiomatic native phrasing for the same idea. Chinese should read as Chinese,
  not as translated English — and it should stay concise, since CJK carries more
  meaning per character.
- **Keep proper nouns in their original form**: Claude Code, Cloudflare, Tauri,
  SKILL.md, Go.

## When SKILL.md changed but the description is still accurate

A typo fix or a restructured section changes the hash without changing what the
skill does. Keep the reviewed text and re-stamp the hash:

```bash
pnpm descriptions:touch <slug>
```

Only do this after reading the diff and confirming the existing text still holds.
