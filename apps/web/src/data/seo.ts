import { SITE_NAME, SITE_REPO, SITE_URL } from "@/data/catalog";
import { skillsData } from "@/data/skills.generated";
import type { SkillRecord } from "@/data/skill-record";
import { localeHref, type Locale } from "@/i18n/config";
import { skillTitles } from "@/data/skill-titles";
import { ui } from "@/i18n/ui";

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

export type JsonLdNode = { [key: string]: JsonLdValue };

export interface PageSeo {
  title: string;
  description: string;
  ogType: string;
  structuredData: JsonLdNode[];
}

export function homeTitle(locale: Locale): string {
  return `${SITE_NAME} - ${ui[locale].siteTagline}`;
}

export function getHomeSeo(locale: Locale): PageSeo {
  return {
    title: homeTitle(locale),
    description: ui[locale].siteDescription,
    ogType: "website",
    structuredData: [
      siteEntity(locale),
      createHomeStructuredData(locale),
      createFaqStructuredData(locale),
    ],
  };
}

export function getSkillSeo(skill: SkillRecord, locale: Locale): PageSeo {
  return {
    title: skillTitles[skill.slug]
      ? `${skill.slug}: ${skillTitles[skill.slug][locale]} | Skills`
      : `${skill.slug} - ${SITE_NAME}`,
    description: skill.displayDescription[locale],
    ogType: "article",
    structuredData: [
      siteEntity(locale),
      createSkillStructuredData(skill, locale),
      createSkillBreadcrumbStructuredData(skill, locale),
    ],
  };
}

function absolute(locale: Locale, path = "/"): string {
  return new URL(localeHref(locale, path), SITE_URL).href;
}

function createHomeStructuredData(locale: Locale): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absolute(locale)}#collection`,
    url: absolute(locale),
    name: homeTitle(locale),
    description: ui[locale].siteDescription,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: skillsData.length,
      itemListElement: skillsData.map((skill, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(locale, `/skills/${skill.slug}`),
        name: skill.slug,
        description: skill.displayDescription[locale],
      })),
    },
  };
}

function createFaqStructuredData(locale: Locale): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absolute(locale)}#faq`,
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: ui[locale].faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function createSkillStructuredData(skill: SkillRecord, locale: Locale): JsonLdNode {
  const url = absolute(locale, `/skills/${skill.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    url,
    headline: `${skill.slug} skill`,
    description: skill.displayDescription[locale],
    inLanguage: locale,
    datePublished: skill.firstAdded,
    dateModified: skill.lastModified,
    author: { "@id": `${SITE_URL}/#publisher` },
    publisher: { "@id": `${SITE_URL}/#publisher` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: ["AI agent skill", skill.category],
    keywords: [skill.slug, skill.category].join(", "),
    sameAs: skill.sourceRepo,
  };
}

function createSkillBreadcrumbStructuredData(
  skill: SkillRecord,
  locale: Locale,
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Skills",
        item: absolute(locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: skill.slug,
        item: absolute(locale, `/skills/${skill.slug}`),
      },
    ],
  };
}

function siteEntity(locale: Locale): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#publisher`,
        name: "XingKaiXin",
        url: SITE_REPO,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: locale,
        publisher: { "@id": `${SITE_URL}/#publisher` },
      },
    ],
  };
}
