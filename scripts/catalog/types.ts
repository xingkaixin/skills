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
  description: string;
  category: string;
  sourceRepo: string;
  sourceKind: SkillSourceKind;
  firstAdded: string;
  lastModified: string;
  language: "en" | "zh-CN";
}

export interface SkillLocation {
  category: string;
  slug: string;
}
