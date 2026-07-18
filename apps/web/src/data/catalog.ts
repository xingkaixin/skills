export type SkillSourceKind = "self" | "upstream" | "adapted";

export interface SkillCatalogEntry {
  source: {
    kind: SkillSourceKind;
    repo: string;
  };
}

export const SITE_REPO = "https://github.com/xingkaixin/skills";
export const SITE_URL = "https://skills.xingkaixin.me";

export const skillCatalog: Record<string, SkillCatalogEntry> = {
  "ai-avoid": {
    source: {
      kind: "upstream",
      repo: "https://github.com/ninehills/skills"
    }
  },
  "article-illustrator": {
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
  "claude-agent-sdk-typescript": {
    source: {
      kind: "self",
      repo: "https://github.com/xingkaixin/claude-agent-sdk-typescript",
    },
  },
  "cover-image": {
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
};
