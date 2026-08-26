import { SITE_URL, SKILLS_INSTALL_SOURCE } from "./catalog.ts";
import type { SkillRecord } from "./skill-record.ts";
import { localeHref, type Locale } from "../i18n/config.ts";

export const MAX_SKILL_SEARCH_RESULTS = 20;

export type SkillSort = "recent" | "az";
export type InstallScope = "all" | "skill";

export interface SkillSearchOptions {
  query?: string;
  category?: string;
  sort?: SkillSort;
  limit?: number;
  locale: Locale;
}

export interface SkillSearchResult {
  query: string;
  category: string;
  sort: SkillSort;
  total: number;
  skills: Array<{
    slug: string;
    name: string;
    category: string;
    summary: string;
    triggerDescription: string;
    lastModified: string;
    url: string;
  }>;
}

export interface SkillDetails {
  slug: string;
  name: string;
  category: string;
  summary: string;
  triggerDescription: string;
  contentLanguage: SkillRecord["contentLanguage"];
  sourceKind: SkillRecord["sourceKind"];
  sourceRepo: string;
  firstAdded: string;
  lastModified: string;
  url: string;
}

export function skillSearchText(skill: SkillRecord): string {
  return [
    skill.slug,
    skill.name,
    skill.category,
    skill.description,
    ...Object.values(skill.displayDescription),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

export function matchesSkillQuery(haystack: string, query: string): boolean {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const normalizedHaystack = haystack.toLocaleLowerCase();
  return terms.every((term) => normalizedHaystack.includes(term));
}

export function searchSkills(
  skills: SkillRecord[],
  options: SkillSearchOptions,
): SkillSearchResult {
  const query = options.query?.trim() ?? "";
  if (query.length > 200) {
    throw new RangeError("query must contain at most 200 characters");
  }

  const category = options.category ?? "all";
  const categories = new Set(skills.map((skill) => skill.category));
  if (category !== "all" && !categories.has(category)) {
    throw new RangeError(`unknown category: ${category}`);
  }

  const sort = options.sort ?? "recent";
  const limit = options.limit ?? 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SKILL_SEARCH_RESULTS) {
    throw new RangeError(`limit must be an integer from 1 to ${MAX_SKILL_SEARCH_RESULTS}`);
  }

  const matches = skills
    .filter(
      (skill) =>
        (category === "all" || skill.category === category) &&
        matchesSkillQuery(skillSearchText(skill), query),
    )
    .sort((left, right) =>
      sort === "recent"
        ? right.lastModified.localeCompare(left.lastModified) ||
          left.slug.localeCompare(right.slug)
        : left.slug.localeCompare(right.slug),
    );

  return {
    query,
    category,
    sort,
    total: matches.length,
    skills: matches.slice(0, limit).map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      summary: skill.displayDescription[options.locale],
      triggerDescription: skill.description,
      lastModified: skill.lastModified,
      url: skillUrl(skill.slug, options.locale),
    })),
  };
}

export function getSkillDetails(
  skills: SkillRecord[],
  slug: string,
  locale: Locale,
): SkillDetails {
  const skill = findSkill(skills, slug);
  return {
    slug: skill.slug,
    name: skill.name,
    category: skill.category,
    summary: skill.displayDescription[locale],
    triggerDescription: skill.description,
    contentLanguage: skill.contentLanguage,
    sourceKind: skill.sourceKind,
    sourceRepo: skill.sourceRepo,
    firstAdded: skill.firstAdded,
    lastModified: skill.lastModified,
    url: skillUrl(skill.slug, locale),
  };
}

export function getInstallCommand(
  skills: SkillRecord[],
  scope: InstallScope,
  slug?: string,
): string {
  if (scope === "all") {
    if (slug !== undefined) {
      throw new TypeError("slug is only valid when scope is skill");
    }
    return `npx skills add ${SKILLS_INSTALL_SOURCE}`;
  }

  if (!slug) {
    throw new TypeError("slug is required when scope is skill");
  }
  const skill = findSkill(skills, slug);
  return `npx skills add ${SKILLS_INSTALL_SOURCE} --skill ${skill.slug}`;
}

function findSkill(skills: SkillRecord[], slug: string): SkillRecord {
  const skill = skills.find((candidate) => candidate.slug === slug);
  if (!skill) {
    throw new RangeError(`unknown skill: ${slug}`);
  }
  return skill;
}

function skillUrl(slug: string, locale: Locale): string {
  return new URL(localeHref(locale, `/skills/${slug}`), SITE_URL).href;
}
