import type { APIRoute } from "astro";
import { SITE_URL } from "@/data/catalog";
import { skillCategories, skillsData } from "@/data/skills.generated";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeHref,
  localeTags,
  type Locale,
} from "@/i18n/config";

export const GET: APIRoute = () =>
  new Response(renderSitemap(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });

function renderSitemap(): string {
  const paths = [
    "/",
    ...skillCategories.map((category) => `/categories/${category}`),
    ...skillsData.map((skill) => `/skills/${skill.slug}`),
  ];
  const urls = paths.flatMap((path) =>
    LOCALES.map((locale) => sitemapUrl(path, locale)),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function sitemapUrl(path: string, locale: Locale): string {
  const alternates = [
    ...LOCALES.map((alternate) =>
      alternateLink(localeTags[alternate], absolute(path, alternate)),
    ),
    alternateLink("x-default", absolute(path, DEFAULT_LOCALE)),
  ];

  return [
    "  <url>",
    `    <loc>${escapeXml(absolute(path, locale))}</loc>`,
    ...alternates,
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
