import type { SkillSourceKind } from "@/data/catalog";

export interface SkillRecord {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  sourceRepo: string;
  sourceKind: SkillSourceKind;
  synced: boolean;
}

export function formatRepoLabel(repoUrl: string): string {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\/+/, "") || repoUrl;
  } catch {
    return repoUrl;
  }
}
