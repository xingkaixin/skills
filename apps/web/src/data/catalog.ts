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
  "ai-avoid": { tags: ["writing"] },
  arrange: { tags: ["design"] },
  "article-illustrator": { tags: ["writing"] },
  "canvas-design": { tags: ["design"] },
  clarify: { tags: ["writing"] },
  "claude-agent-sdk-typescript": {
    tags: ["backend"],
    source: {
      kind: "adapted",
      repo: "https://github.com/anthropics/claude-agent-sdk-typescript",
    },
  },
  "cloudflare-deploy": { tags: ["deploy"] },
  "composition-patterns": { tags: ["frontend"] },
  "context7-cli": { tags: ["other"] },
  "cover-image": { tags: ["writing"] },
  "db-ferry": { tags: ["other"] },
  "design-taste-frontend": { tags: ["design"] },
  ds: { tags: ["other"] },
  "fast-rust": { tags: ["backend"] },
  "friendly-python": { tags: ["backend"] },
  "frontend-design": { tags: ["design"] },
  "frontend-testing": { tags: ["frontend"] },
  "gh-fix-ci": { tags: ["ci"] },
  hono: { tags: ["backend"] },
  "klip-writing": { tags: ["writing"] },
  "landing-page-design": { tags: ["design"] },
  "modular-go": { tags: ["backend"] },
  piglet: { tags: ["backend"] },
  "playwright-cli": { tags: ["frontend"] },
  "react-best-practices": { tags: ["frontend"] },
  "react-view-transitions": { tags: ["frontend"] },
  shadcn: { tags: ["frontend"] },
  slidev: { tags: ["writing"] },
  "stock-report": { tags: ["finance"] },
  streamdown: { tags: ["frontend"] },
  "ui-ux-pro-max": { tags: ["design"] },
  "use-modern-go": { tags: ["backend"] },
  vitest: { tags: ["frontend"] },
  "web-design-guidelines": { tags: ["design"] },
};
