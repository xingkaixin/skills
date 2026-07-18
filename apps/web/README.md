# skills-web

Skills catalog frontend — a static site built with Astro and deployed to Cloudflare Pages.

## Tech Stack

- [Astro](https://astro.build/) — static site generator
- [Tailwind CSS v4](https://tailwindcss.com/) — styling

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm deploy:cf` | Deploy to Cloudflare Pages |

## Project Structure

```
src/
  components/
    SiteBrand.astro   # Site brand component
    SkillFilter.astro # Filterable skill list
  layouts/
    BaseLayout.astro  # Shared HTML shell and SEO tags
  pages/
    index.astro       # Home page
    404.astro         # 404 page
    sitemap.xml.ts    # Sitemap endpoint
    skills/
      [slug].astro    # Skill detail pages
  styles/
    globals.css       # Tailwind and global styles
  data/
    skills.ts         # Skill data helpers
    skills.generated.ts # Generated skill data
    skill-record.ts   # Skill record types
    catalog.ts        # Catalog constants
    seo.ts            # SEO and structured data helpers
```

## Deploy

### Cloudflare Pages

```bash
pnpm build
pnpm deploy:cf
```

Astro pre-renders the catalog, every skill detail page, the 404 page, and `sitemap.xml` into `dist/`.

## Generating Skill Data

Skill data is auto-generated from the repository's skill definitions:

```bash
pnpm --filter skills generate:web-data
```

This scans `skills/{category}/{skill-name}` and updates the generated catalog. The category
directory is the source of truth for website filters and skill metadata.
