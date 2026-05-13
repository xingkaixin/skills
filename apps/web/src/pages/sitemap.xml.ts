import type { APIRoute } from "astro";
import { SITE_URL } from "@/data/catalog";
import { skillsData } from "@/data/skills.generated";

export const GET: APIRoute = () =>
  new Response(renderSitemap(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });

function renderSitemap(): string {
  const homeLastModified =
    skillsData
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
  return `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastModified}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
