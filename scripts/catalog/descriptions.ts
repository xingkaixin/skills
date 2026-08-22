import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const LOCALES = ["en", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** BCP 47 tags for `<html lang>`, `og:locale`, and `hreflang`. */
export const localeTags: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
  ja: "ja",
};

export type LocalizedText = Record<Locale, string>;

export interface SkillDescription extends LocalizedText {
  /** Hash of the SKILL.md this text was written from; guards against silent drift. */
  sourceHash: string;
}

export const DESCRIPTIONS_PATH = "content/skill-descriptions.json";

export function hashSkillSource(description: string, body: string): string {
  return createHash("sha256")
    .update(`${description.trim()}\n\n${body.trim()}`)
    .digest("hex")
    .slice(0, 16);
}

export async function loadSkillDescriptions(
  repoRoot: string,
): Promise<Record<string, SkillDescription>> {
  try {
    const raw = await fs.readFile(path.join(repoRoot, DESCRIPTIONS_PATH), "utf8");
    return JSON.parse(raw) as Record<string, SkillDescription>;
  } catch {
    return {};
  }
}

export interface DescriptionRequest {
  slug: string;
  reason: "missing" | "stale" | "incomplete";
  sourceHash: string;
}

/**
 * Display descriptions are authored offline, so they cannot be derived at build
 * time. This reports which skills still need a human-reviewed write-up.
 */
export function findOutdatedDescriptions(
  sources: Array<{ slug: string; sourceHash: string }>,
  descriptions: Record<string, SkillDescription>,
): DescriptionRequest[] {
  const requests: DescriptionRequest[] = [];
  for (const { slug, sourceHash } of sources) {
    const entry = descriptions[slug];
    if (!entry) {
      requests.push({ slug, reason: "missing", sourceHash });
    } else if (LOCALES.some((locale) => !entry[locale]?.trim())) {
      requests.push({ slug, reason: "incomplete", sourceHash });
    } else if (entry.sourceHash !== sourceHash) {
      requests.push({ slug, reason: "stale", sourceHash });
    }
  }
  return requests;
}

export function describeOutdated(requests: DescriptionRequest[]): string {
  const reasons: Record<DescriptionRequest["reason"], string> = {
    missing: "no display description yet",
    incomplete: "missing one or more locales",
    stale: "SKILL.md changed since the description was written",
  };
  return [
    `${requests.length} skill(s) need a display description in ${DESCRIPTIONS_PATH}:`,
    ...requests.map((request) => `- ${request.slug}: ${reasons[request.reason]}`),
    "",
    "Run the /skill-descriptions command to author them, then re-run the build.",
  ].join("\n");
}
