import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { SITE_REPO, SITE_URL } from "./src/data/catalog";
import { skillsData } from "./src/data/skills.generated";

interface StaticPage {
  title: string;
  description: string;
  canonicalUrl: string;
  rootHtml: string;
}

function staticPagesPlugin(): Plugin {
  return {
    name: "static-pages",
    enforce: "post",
    generateBundle(_, bundle) {
      const indexAsset = bundle["index.html"];
      if (!indexAsset || indexAsset.type !== "asset" || typeof indexAsset.source !== "string") {
        return;
      }

      const template = indexAsset.source;
      const homePage = createHomePage();
      indexAsset.source = renderHtml(template, homePage);

      for (const skill of skillsData) {
        const page = createSkillPage(skill);
        const source = renderHtml(template, page);
        this.emitFile({
          type: "asset",
          fileName: `skills/${skill.slug}.html`,
          source,
        });
        this.emitFile({
          type: "asset",
          fileName: `skills/${skill.slug}/index.html`,
          source,
        });
      }

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: renderSitemap() });
    },
  };
}

function createHomePage(): StaticPage {
  const title = "XingKaiXin's Skills - AI Agent Skill Catalog";
  const description =
    "Browse and install AI agent skills for Claude Code and other AI coding tools. A curated catalog covering frontend, backend, writing, design, and more.";

  return {
    title,
    description,
    canonicalUrl: `${SITE_URL}/`,
    rootHtml: renderHomeRoot(),
  };
}

function createSkillPage(skill: (typeof skillsData)[number]): StaticPage {
  const description =
    skill.description.length > 160 ? `${skill.description.slice(0, 157)}...` : skill.description;

  return {
    title: `${skill.slug} - XingKaiXin's Skills`,
    description,
    canonicalUrl: `${SITE_URL}/skills/${skill.slug}`,
    rootHtml: renderSkillRoot(skill),
  };
}

function renderHtml(template: string, page: StaticPage): string {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeAttr(page.description)}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${escapeAttr(page.canonicalUrl)}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${escapeAttr(page.title)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${escapeAttr(page.description)}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${escapeAttr(page.canonicalUrl)}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${escapeAttr(page.title)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${escapeAttr(page.description)}" />`,
    );

  return html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${page.rootHtml}</div>`,
  );
}

function renderHomeRoot(): string {
  const skillItems = skillsData
    .map(
      (skill) => `
          <a href="/skills/${escapeAttr(skill.slug)}" class="flex items-baseline gap-6 py-3 px-1 transition-colors hover:bg-accent-soft group">
            <span class="w-44 shrink-0 font-medium text-sm text-text truncate">${escapeHtml(skill.slug)}</span>
            <span class="flex-1 min-w-0 text-sm text-text-secondary truncate">${escapeHtml(skill.description)}</span>
            <span class="text-xs text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">-&gt;</span>
          </a>`,
    )
    .join("");

  return `
    <div class="font-sans min-h-screen">
      <div class="min-h-screen">
        <nav class="border-b border-border px-6 py-4">
          <div class="mx-auto flex max-w-5xl items-center justify-between gap-6">
            <a href="/" class="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-text">XingKaiXin's Skills</a>
            <a href="${escapeAttr(SITE_REPO)}" target="_blank" rel="noopener noreferrer" class="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-text hover:text-text">GitHub</a>
          </div>
        </nav>
        <div class="border-b border-border px-6 py-2">
          <div class="mx-auto max-w-5xl">
            <p class="text-xs text-text-muted">xingkaixin&nbsp;/&nbsp;<span class="text-text-secondary font-medium">skills</span></p>
          </div>
        </div>
        <main class="mx-auto max-w-5xl px-6 pb-20 pt-8">
          <h1 class="font-semibold text-xl text-text">xingkaixin/skills</h1>
          <p class="mt-1.5 text-sm text-text-secondary">Agent skills for AI Agents</p>
          <div class="mt-8 space-y-4">
            <p class="text-xs uppercase tracking-[0.18em] text-text-muted">Usage</p>
            <div>
              <p class="mb-1.5 text-xs text-text-muted">Install all skills</p>
              <div class="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
                <code class="font-mono text-sm text-text">npx skills add xingkaixin/skills</code>
              </div>
            </div>
            <div>
              <p class="mb-1.5 text-xs text-text-muted">Install a single skill</p>
              <div class="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
                <code class="font-mono text-sm text-text">npx skills add xingkaixin/skills --skill agent-dump</code>
              </div>
            </div>
          </div>
          <hr class="my-8 border-border" />
          <div>
            <div class="sticky top-0 z-10 -mx-6 px-6 py-3 bg-bg border-b border-border flex flex-wrap items-center gap-2 mb-6">
              <span class="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] transition border-text bg-text text-white">All</span>
              <span class="ml-auto text-xs text-text-muted">${skillsData.length} skills</span>
            </div>
            <div class="divide-y divide-border">${skillItems}
            </div>
          </div>
        </main>
      </div>
    </div>`;
}

function renderSkillRoot(skill: (typeof skillsData)[number]): string {
  const pageUrl = `${SITE_URL}/skills/${skill.slug}`;
  const tagLinks = skill.tags
    .map(
      (tag) =>
        `<a href="/?tag=${encodeURIComponent(tag)}" class="tag-pill hover:border-text hover:text-text">${escapeHtml(tag)}</a>`,
    )
    .join("");

  return `
    <div class="font-sans min-h-screen">
      <div class="min-h-screen">
        <nav class="border-b border-border px-6 py-4">
          <div class="mx-auto flex max-w-5xl items-center justify-between gap-6">
            <a href="/" class="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-text">XingKaiXin's Skills</a>
            <a href="/" class="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-text hover:text-text">Catalog</a>
          </div>
        </nav>
        <div class="border-b border-border px-6 py-2">
          <div class="mx-auto max-w-5xl">
            <p class="text-xs text-text-muted">
              <a href="/" class="transition hover:text-text-secondary">xingkaixin&nbsp;/&nbsp;skills</a>
              <span class="mx-1.5">/</span>
              <span class="text-text-secondary font-medium">${escapeHtml(skill.slug)}</span>
            </p>
          </div>
        </div>
        <main class="mx-auto max-w-5xl px-6 pb-20 pt-8">
          <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <h1 class="font-semibold text-2xl text-text">${escapeHtml(skill.slug)}</h1>
              <div class="mt-5 space-y-3">
                <p class="text-xs uppercase tracking-[0.18em] text-text-muted">Install</p>
                <div class="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
                  <code class="font-mono text-sm text-text">npx skills add xingkaixin/skills --skill ${escapeHtml(skill.slug)}</code>
                </div>
              </div>
              <p class="mt-6 text-sm leading-7 text-text-secondary">${escapeHtml(skill.description)}</p>
              <div class="mt-6 flex flex-wrap gap-2">${tagLinks}</div>
            </div>
            <aside class="lg:w-56 lg:shrink-0">
              <div class="rounded-md border border-border p-4">
                <p class="text-[11px] uppercase tracking-[0.28em] text-text-muted">Source Repo</p>
                <div class="mt-3">
                  <a href="${escapeAttr(skill.sourceRepo)}" target="_blank" rel="noopener noreferrer" class="text-sm text-text underline underline-offset-4 transition hover:text-text-secondary">${escapeHtml(formatRepoLabel(skill.sourceRepo))}</a>
                </div>
              </div>
            </aside>
          </div>
          <a href="${escapeAttr(pageUrl)}" class="sr-only">${escapeHtml(pageUrl)}</a>
        </main>
      </div>
    </div>`;
}

function renderSitemap(): string {
  const homeLastModified = skillsData
    .map((skill) => skill.lastModified)
    .sort()
    .at(-1) ?? new Date().toISOString().split("T")[0];

  const urls = [
    sitemapUrl(`${SITE_URL}/`, homeLastModified, "weekly", "1.0"),
    ...skillsData.map((skill) =>
      sitemapUrl(`${SITE_URL}/skills/${skill.slug}`, skill.lastModified, "monthly", "0.8"),
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function sitemapUrl(url: string, lastModified: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeHtml(url)}</loc>\n    <lastmod>${lastModified}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function formatRepoLabel(repoUrl: string): string {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\/+/, "") || repoUrl;
  } catch {
    return repoUrl;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export default defineConfig({
  plugins: [react(), tailwindcss(), staticPagesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
