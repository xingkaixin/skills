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
  adapt: { tags: ["design"] },
  "agent-browser": { tags: ["other"] },
  "agent-dump": { tags: ["other"] },
  "ai-avoid": {
    tags: ["writing"],
    source: {
      kind: "upstream",
      repo: "https://github.com/ninehills/skills"
    }
  },
  animate: { tags: ["design"] },
  arrange: { tags: ["design"] },
  "article-illustrator": {
    tags: ["writing"],
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
  audit: { tags: ["design"] },
  bolder: { tags: ["design"] },
  "canvas-design": { tags: ["design"] },
  clarify: { tags: ["writing"] },
  "claude-agent-sdk-typescript": {
    tags: ["backend"],
    source: {
      kind: "self",
      repo: "https://github.com/xingkaixin/claude-agent-sdk-typescript",
    },
  },
  "cloudflare-deploy": { tags: ["deploy"] },
  colorize: { tags: ["design"] },
  "composition-patterns": { tags: ["frontend"] },
  "context7-cli": { tags: ["other"] },
  "cover-image": {
    tags: ["writing"],
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills"
    }
  },
  critique: { tags: ["design"] },
  "db-ferry": { tags: ["other"] },
  delight: { tags: ["design"] },
  distill: { tags: ["design"] },
  ds: { tags: ["other"] },
  extract: { tags: ["design"] },
  "fast-rust": { tags: ["backend"] },
  "friendly-python": { tags: ["backend"] },
  "frontend-design": { tags: ["design"] },
  "frontend-testing": { tags: ["frontend"] },
  "gh-fix-ci": { tags: ["ci"] },
  harden: { tags: ["design"] },
  hono: { tags: ["backend"] },
  "klip-writing": { tags: ["writing"] },
  "landing-page-design": { tags: ["design"] },
  "modular-go": { tags: ["backend"] },
  normalize: { tags: ["design"] },
  onboard: { tags: ["design"] },
  optimize: { tags: ["design"] },
  overdrive: { tags: ["design"] },
  piglet: { tags: ["backend"] },
  "playwright-cli": { tags: ["frontend"] },
  polish: { tags: ["design"] },
  quieter: { tags: ["design"] },
  "react-best-practices": { tags: ["frontend"] },
  "react-view-transitions": { tags: ["frontend"] },
  shadcn: { tags: ["frontend"] },
  slidev: { tags: ["writing"] },
  "stock-report": { tags: ["finance"] },
  streamdown: { tags: ["frontend"] },
  "teach-impeccable": { tags: ["design"] },
  typeset: { tags: ["design"] },
  "use-modern-go": { tags: ["backend"] },
  vitest: { tags: ["frontend"] },
  "web-design-guidelines": { tags: ["design"] },
};
