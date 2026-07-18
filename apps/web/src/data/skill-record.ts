import type { SkillSourceKind } from "@/data/catalog";

export interface SkillRecord {
  slug: string;
  name: string;
  description: string;
  category: string;
  sourceRepo: string;
  sourceKind: SkillSourceKind;
  firstAdded: string;
  lastModified: string;
}

export function formatRepoLabel(repoUrl: string): string {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\/+/, "") || repoUrl;
  } catch {
    return repoUrl;
  }
}
