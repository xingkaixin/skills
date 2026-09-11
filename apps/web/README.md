# skills-web

Skills catalog frontend — a static site built with Astro and deployed to Cloudflare Pages.

## Tech Stack

- [Astro](https://astro.build/) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com/) — styling

## Getting Started

```bash
cd ../..
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server from the repository root |
| `pnpm build` | Generate skill data and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Check root TypeScript and Astro templates |
| `pnpm test` | Run catalog and stock-report tests |
| `pnpm check` | Run every required verification |
| `pnpm deploy:cf` | Deploy to Cloudflare Pages |

## Project Structure

```
src/
  components/
    SiteBrand.astro       # Site brand component
    SiteHeader.astro      # Header, search, language switcher
    SkillCatalog.astro    # Filterable, sortable skill list
    LanguageSwitcher.astro
  layouts/
    BaseLayout.astro      # Shared HTML shell, SEO tags, hreflang
  pages/
    404.astro             # 404 page, with a way back in every locale
    sitemap.xml.ts        # Sitemap endpoint
    [...locale]/
      index.astro         # Home page
      skills/
        [slug].astro      # Skill detail pages
  i18n/
    config.ts             # Locales, BCP 47 tags, path helpers
    ui.ts                 # UI strings and FAQ per locale
  styles/
    globals.css           # Tailwind and global styles
  data/
    skills.generated.ts   # Generated skill data
    skill-record.ts       # Skill record types
    catalog.ts            # Catalog constants
    seo.ts                # SEO and structured data helpers
```

## Deploy

### Cloudflare Pages

```bash
pnpm build
pnpm deploy:cf
```

Astro pre-renders the catalog, every skill detail page, the 404 page, and `sitemap.xml` into `dist/` — the catalog and detail pages once per locale.

HTML pages use the `file` build format so Pages serves the extensionless canonical
URLs directly, without redirecting to trailing-slash URLs.

## Languages

The site renders in English, Chinese, and Japanese. English owns the bare paths
(`/skills/foo`); the others are prefixed (`/zh/skills/foo`, `/ja/skills/foo`).

Two kinds of text are translated, and they live in different places:

- **UI strings and the FAQ** — `src/i18n/ui.ts`. English defines the shape, so a
  key missing from another locale is a type error.
- **Skill summaries** — `content/skill-descriptions.json` at the repository
  root, authored via the `/skill-descriptions` command. Skill bodies stay in
  whatever language they were written in; the detail page says so when that
  differs from the locale being read.

Adding a locale means extending `LOCALES` in `src/i18n/config.ts`, adding its
tags and name there, filling in `ui.ts`, and writing that locale into every
entry of `content/skill-descriptions.json`.

## WebMCP

Browsers that implement the Web Model Context API can discover three read-only
tools on every page:

- `search_skills` searches skill metadata and synchronizes the visible catalog.
- `get_skill` returns exact metadata and the localized detail URL for one skill.
- `get_install_command` returns, but never executes, a validated install command.

The tools are registered through `document.modelContext` when the API exists.
Other browsers keep the same site behavior without a polyfill.

## Generating Skill Data

Skill data is auto-generated from the repository's skill definitions:

```bash
pnpm generate:web-data
```

This scans `skills/{category}/{skill-name}` and updates Web data, Claude marketplace,
Codex marketplace, and category plugin manifests. The category directory is the source
of truth for catalog membership; platform-specific display metadata lives in
`scripts/catalog/config.ts`.

## Agent HTTP access

The build generates `/api/skills.json`, `/openapi.json`,
`/.well-known/api-catalog`, and Markdown copies of all localized home and skill
pages from the same catalog and skill sources. `/api-docs.md` describes the
read-only catalog API. Do not edit these build outputs in `dist/`.

The Pages advanced-mode worker in `public/_worker.js` negotiates Markdown for
explicit `Accept: text/markdown` requests, respecting quality values. HTML stays
the default. Both representations carry `Vary: Accept` and `private, no-store`
to prevent caches from mixing representations. The worker also adds discovery
Link headers and the API catalog media type, including for HEAD requests.
`_routes.json` limits worker invocation to page and API catalog routes; ordinary
static assets bypass it. This uses Pages Functions, not the paid Markdown for
Agents switch, and page requests consume the project's Functions allowance.

`robots.txt` declares `ai-train=yes, search=yes, ai-input=yes` for all agents.

Astro dev/preview do not execute the Pages worker. To verify production HTTP
behavior locally, run from the repository root:

```sh
pnpm build
pnpm --filter web exec wrangler pages dev dist --port 8788
curl -i -H 'Accept: text/markdown' http://localhost:8788/
curl -I http://localhost:8788/.well-known/api-catalog
```

Deploy the entire `dist/` directory, including `_worker.js` and `_routes.json`,
using the existing Pages deployment command. After deployment, scan the public
URL with `POST https://isitagentready.com/api/scan` and JSON body
`{"url":"https://skills.xingkaixin.me"}`.
