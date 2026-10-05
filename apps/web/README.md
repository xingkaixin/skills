# skills-web

Skills catalog frontend — a static site built with Astro and deployed to Cloudflare Workers.

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
| `pnpm deploy:cf` | Deploy to Cloudflare Workers |

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

### Cloudflare Workers

```bash
pnpm deploy:cf
```

Use the `cf` CLI installed globally through mise and sign in with `cf auth login`.
Do not install `cf` as a project dependency. The root deployment command generates
catalog data, builds Astro, and runs `cf deploy --prebuilt` from `apps/web`.
`build-cloudflare.mjs` packages the static assets and `worker.js` into
`.cloudflare/output/v0/`, including the `skills.xingkaixin.me` custom domain.
Run `pnpm --filter web exec cf deploy --prebuilt --dry-run` after a build to
validate the deployment without uploading it.

Astro pre-renders the catalog, every skill detail page, the 404 page, and `sitemap.xml` into `dist/` — the catalog, category pages, and detail pages once per locale.

HTML pages use the `file` build format so Workers serves the extensionless canonical
URLs directly, without redirecting to trailing-slash URLs.

### Search discovery

Category links open static `/categories/{category}` pages in each locale. Category
membership comes from the generated skill records; localized category titles and
summaries live in `scripts/catalog/config.ts`.

The sitemap includes only canonical home, category, and skill URLs with reciprocal
language alternates. It omits `lastmod`: the skill source date does not include
changes to translated summaries, titles, or page templates. Do not use deployment
time as a substitute for a page's meaningful content modification date.

### Analytics

`BaseLayout.astro` loads only Umami on the production domain. Keep the zone's
Configuration Rule for `http.host eq "skills.xingkaixin.me"` with Disable RUM
enabled to prevent automatic Cloudflare Web Analytics injection.

Umami records one pageview per document load. Automatic History API pageviews are
disabled because catalog searches use `replaceState`; hashes are excluded so table
of contents links do not fragment page reports. Query parameters remain available
for UTM attribution. Core Web Vitals collection is enabled.

`install-command-copy` is sent only after the clipboard write succeeds, with
`scope` (`all` or `skill`), `skill` (slug or `all`), and `locale`. Code samples do
not count as installations. The Umami goal “安装命令复制” matches that event; it
measures install intent, not a completed CLI installation.

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

The Worker in `worker.js` negotiates Markdown for
explicit `Accept: text/markdown` requests, respecting quality values. HTML stays
the default. Both representations carry `Vary: Accept` and `private, no-store`
to prevent caches from mixing representations. The worker also adds discovery
Link headers and the API catalog media type, including for HEAD requests.
`assets.runWorkerFirst` in `build-cloudflare.mjs` limits Worker-first routing
to page and API catalog routes; ordinary static assets bypass it. Page requests
use the Workers request allowance.

`robots.txt` declares `ai-train=yes, search=yes, ai-input=yes` for all agents.

Astro dev/preview do not execute the Worker. After building, validate the cf
Build Output and run the existing response tests from the repository root:

```sh
pnpm build
pnpm --filter web exec cf deploy --prebuilt --dry-run
node --test tests/agent-response.test.js
```

After deploying, verify HTML and Markdown negotiation, HEAD discovery headers,
static asset caching, and the custom 404 page on the production domain:

```sh
curl -i -H 'Accept: text/markdown' https://skills.xingkaixin.me/
curl -I https://skills.xingkaixin.me/.well-known/api-catalog
```
