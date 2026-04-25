export type SkillSourceKind = "self" | "upstream" | "adapted";

export interface SkillCatalogEntry {
  tags: string[];
  source?: {
    kind: SkillSourceKind;
    repo: string;
  };
}

export const SITE_REPO = "https://github.com/xingkaixin/skills";

export const skillCatalog: Record<string, SkillCatalogEntry> = {
  "agent-browser": { tags: ["other"] },
  "agent-dump": { tags: ["other"] },
  "ai-avoid": {
    tags: ["writing"],
    source: {
      kind: "upstream",
      repo: "https://github.com/ninehills/skills"
    }
  },
  "article-illustrator": {
    tags: ["writing"],
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
  "canvas-design": { tags: ["design"] },
  "claude-agent-sdk-typescript": {
    tags: ["backend"],
    source: {
      kind: "self",
      repo: "https://github.com/xingkaixin/claude-agent-sdk-typescript",
    },
  },
  "cloudflare-deploy": { tags: ["deploy"] },
  "composition-patterns": { tags: ["frontend"] },
  "context7-cli": { tags: ["other"] },
  "cover-image": {
    tags: ["writing"],
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
  "db-ferry": { tags: ["other"] },
  ds: { tags: ["other"] },
  "fast-rust": { tags: ["backend"] },
  "friendly-python": { tags: ["backend"] },
  "frontend-design": { tags: ["design"] },
  "frontend-testing": { tags: ["frontend"] },
  "gh-fix-ci": { tags: ["ci"] },
  hono: { tags: ["backend"] },
  "klip-writing": { tags: ["writing"] },
  "modular-go": { tags: ["backend"] },
  piglet: { tags: ["backend"] },
  "playwright-cli": { tags: ["frontend"] },
  "react-best-practices": { tags: ["frontend"] },
  "react-view-transitions": { tags: ["frontend"] },
  "save-the-cat-writing": { tags: ["writing"] },
  shadcn: { tags: ["frontend"] },
  slidev: { tags: ["writing"] },
  "stock-report": { tags: ["finance"] },
  streamdown: { tags: ["frontend"] },
  "use-modern-go": { tags: ["backend"] },
  vitest: { tags: ["frontend"] },
  "web-design-guidelines": { tags: ["design"] },
};
