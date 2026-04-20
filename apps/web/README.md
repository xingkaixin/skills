# skills-web

Skills catalog frontend — a single-page app built with Vite, React, and React Router, deployed to Cloudflare Pages.

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool
- [React](https://react.dev/) — UI library
- [React Router](https://reactrouter.com/) — client-side routing
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [Framer Motion](https://motion.dev/) — page transitions

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
  app/
    layout.tsx        # Root layout wrapper
    page.tsx          # Home page (skill catalog)
    skill-list.tsx    # Filterable skill list
    brand.tsx         # Site brand component
    nav-direction.tsx # Navigation direction context
    scroll-restoration.tsx # Scroll position restoration
    template.tsx      # Page transition wrapper
    not-found.tsx     # 404 page
    skills/
      [name]/
        page.tsx      # Skill detail page
  data/
    skills.ts         # Skill data helpers
    skills.generated.ts # Generated skill data
    skill-record.ts   # Skill record types
    catalog.ts        # Catalog constants
```

## Deploy

### Cloudflare Pages

```bash
pnpm build
pnpm deploy:cf
```

The app is configured as a static SPA with `_redirects` (all routes → `index.html`) for client-side routing support.

## Generating Skill Data

Skill data is auto-generated from the repository's skill definitions:

```bash
pnpm --filter skills generate:web-data
```

This updates `src/data/skills.generated.ts` with the latest catalog.
