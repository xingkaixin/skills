import type { LocalizedText } from "./locales.ts";

export type SkillSourceKind = "self" | "upstream" | "adapted";

export interface SkillCatalogEntry {
  source: {
    kind: SkillSourceKind;
    repo: string;
  };
}

export interface SkillRecord {
  slug: string;
  name: string;
  /** Frontmatter description: an agent trigger, not written for human readers. */
  description: string;
  /** Human-facing summary authored per locale; see content/skill-descriptions.json. */
  displayDescription: LocalizedText;
  category: string;
  sourceRepo: string;
  sourceKind: SkillSourceKind;
  firstAdded: string;
  lastModified: string;
  /** Language the SKILL.md itself is written in, independent of the UI locale. */
  contentLanguage: "en" | "zh-CN";
}

export interface SkillLocation {
  category: string;
  slug: string;
}
