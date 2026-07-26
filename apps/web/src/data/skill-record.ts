export type {
  SkillRecord,
  SkillSourceKind,
} from "../../../../scripts/catalog/types.ts";

export function formatRepoLabel(repoUrl: string): string {
  try {
    const url = new URL(repoUrl);
    return url.pathname.replace(/^\/+/, "") || repoUrl;
  } catch {
    return repoUrl;
  }
}
