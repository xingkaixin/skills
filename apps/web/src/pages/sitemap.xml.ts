import type { APIRoute } from "astro";
import { SITE_URL } from "@/data/catalog";
import { skillsData } from "@/data/skills.generated";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeHref,
  localeTags,
  type Locale,
} from "@/i18n/config";

interface Page {
  path: string;
  lastModified: string;
  changefreq: string;
  priority: string;
}

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

  const pages: Page[] = [
    { path: "/", lastModified: homeLastModified, changefreq: "weekly", priority: "1.0" },
    ...skillsData.map((skill) => ({
      path: `/skills/${skill.slug}`,
      lastModified: skill.lastModified,
      changefreq: "monthly",
      priority: "0.8",
    })),
  ];

  // Every locale gets its own entry, each listing all of them as alternates.
  const urls = pages.flatMap((page) =>
    LOCALES.map((locale) => sitemapUrl(page, locale)),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function sitemapUrl(page: Page, locale: Locale): string {
  const alternates = [
    ...LOCALES.map((alternate) =>
      alternateLink(localeTags[alternate], absolute(page.path, alternate)),
    ),
    alternateLink("x-default", absolute(page.path, DEFAULT_LOCALE)),
  ];

  return [
    "  <url>",
    `    <loc>${escapeXml(absolute(page.path, locale))}</loc>`,
    ...alternates,
    `    <lastmod>${page.lastModified}</lastmod>`,
    `    <changefreq>${page.changefreq}</changefreq>`,
    `    <priority>${page.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function alternateLink(hreflang: string, href: string): string {
  return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}" />`;
}

function absolute(path: string, locale: Locale): string {
  return new URL(localeHref(locale, path), SITE_URL).href;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
