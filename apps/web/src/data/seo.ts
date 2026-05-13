import { SITE_REPO, SITE_URL } from "@/data/catalog";
import { skillsData } from "@/data/skills.generated";
import type { SkillRecord } from "@/data/skill-record";

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
  canonicalUrl: string;
  structuredData: JsonLdNode[];
}

export const HOME_TITLE = "XingKaiXin's Skills - AI Agent Skill Catalog";
export const HOME_DESCRIPTION =
  "Browse and install AI agent skills for Claude Code and other AI coding tools. A curated catalog covering frontend, backend, writing, design, and more.";

export function getHomeSeo(): PageSeo {
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonicalUrl: `${SITE_URL}/`,
    structuredData: [siteEntity(), createHomeStructuredData()],
  };
}

export function getSkillSeo(skill: SkillRecord): PageSeo {
  const description =
    skill.description.length > 160 ? `${skill.description.slice(0, 157)}...` : skill.description;

  return {
    title: `${skill.slug} - XingKaiXin's Skills`,
    description,
    canonicalUrl: `${SITE_URL}/skills/${skill.slug}`,
    structuredData: [
      siteEntity(),
      createSkillStructuredData(skill),
      createSkillBreadcrumbStructuredData(skill),
    ],
  };
}

function createHomeStructuredData(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#collection`,
    url: `${SITE_URL}/`,
    name: HOME_TITLE,
    description: HOME_DESCRIPTION,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: skillsData.length,
      itemListElement: skillsData.map((skill, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/skills/${skill.slug}`,
        name: skill.slug,
        description: skill.description,
      })),
    },
  };
}

function createSkillStructuredData(skill: SkillRecord): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${SITE_URL}/skills/${skill.slug}#article`,
    url: `${SITE_URL}/skills/${skill.slug}`,
    headline: `${skill.slug} skill`,
    description: skill.description,
    dateModified: skill.lastModified,
    author: { "@id": `${SITE_URL}/#publisher` },
    publisher: { "@id": `${SITE_URL}/#publisher` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: ["AI agent skill", ...skill.tags],
    keywords: [skill.slug, ...skill.tags].join(", "),
    sameAs: skill.sourceRepo,
  };
}

function createSkillBreadcrumbStructuredData(skill: SkillRecord): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Skills",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: skill.slug,
        item: `${SITE_URL}/skills/${skill.slug}`,
      },
    ],
  };
}

function siteEntity(): JsonLdNode {
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
        name: "XingKaiXin's Skills",
        url: `${SITE_URL}/`,
        publisher: { "@id": `${SITE_URL}/#publisher` },
      },
    ],
  };
}
