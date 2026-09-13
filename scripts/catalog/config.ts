import type { SkillCatalogEntry } from "./types.ts";

export const SITE_NAME = "xingkaixin/skills";
export const SITE_REPO = "https://github.com/xingkaixin/skills";
export const SITE_URL = "https://skills.xingkaixin.me";
export const SKILLS_INSTALL_SOURCE = "xingkaixin/skills";

export interface CategoryMetadata {
  description: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  codexCategory: "Developer Tools" | "Productivity";
  defaultPrompt: string;
}

export const categoryMetadata: Record<string, CategoryMetadata> = {
  backend: {
    description: "Backend engineering, CLI, architecture, scaffolding, and Go skills",
    displayName: "Backend Skills",
    shortDescription: "Backend engineering and architecture skills.",
    longDescription:
      "Backend engineering workflows for CLIs, architecture, project scaffolding, and modern Go.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me solve this backend engineering task.",
  },
  ci: {
    description: "Release changelog and Git commit workflow skills",
    displayName: "CI Skills",
    shortDescription: "Release and commit workflow skills.",
    longDescription:
      "Continuous integration workflows for bilingual release changelogs and consistent Git commits.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me prepare this release or Git commit.",
  },
  deploy: {
    description: "Cloud deployment and platform migration skills",
    displayName: "Deploy Skills",
    shortDescription: "Cloud deployment and migration skills.",
    longDescription:
      "Deployment workflows for Cloudflare platforms and migrations from Vercel.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me deploy or migrate this application.",
  },
  design: {
    description: "Visual design, design system, and interface writing skills",
    displayName: "Design Skills",
    shortDescription: "Visual design, design systems, and interface writing.",
    longDescription:
      "Design workflows for visual hierarchy, layout, typography, color, input-driven design systems, and effective error messages.",
    codexCategory: "Productivity",
    defaultPrompt: "Help me improve this product design.",
  },
  desktop: {
    description: "Electron and Tauri desktop application skills",
    displayName: "Desktop Skills",
    shortDescription: "Electron and Tauri application skills.",
    longDescription:
      "Desktop application workflows for Electron releases and Tauri menubar agents.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me build or release this desktop app.",
  },
  finance: {
    description: "Financial research and reporting skills",
    displayName: "Finance Skills",
    shortDescription: "Financial research and reporting skills.",
    longDescription:
      "Financial analysis workflows for researching companies and producing stock reports.",
    codexCategory: "Productivity",
    defaultPrompt: "Research this company and prepare a stock report.",
  },
  frontend: {
    description: "Frontend performance and state management skills",
    displayName: "Frontend Skills",
    shortDescription: "Frontend performance and state skills.",
    longDescription:
      "Frontend engineering workflows for large data performance and React state management decisions.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me solve this frontend engineering task.",
  },
  ios: {
    description: "iOS vision, recording, widget, and App Store delivery skills",
    displayName: "iOS Skills",
    shortDescription: "iOS platform and delivery skills.",
    longDescription:
      "iOS engineering workflows for on-device ML, recording integrations, widgets, and App Store delivery.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me implement or ship this iOS feature.",
  },
  workflow: {
    description: "Code review, planning, issue tracking, and skill authoring workflows",
    displayName: "Workflow Skills",
    shortDescription: "Engineering and issue management workflows.",
    longDescription:
      "Structured workflows for code review, planning, issue tracking, implementation loops, and skill authoring.",
    codexCategory: "Productivity",
    defaultPrompt: "Help me plan and execute this engineering workflow.",
  },
  writing: {
    description: "Writing, translation, illustration, and editorial skills",
    displayName: "Writing Skills",
    shortDescription: "Writing and editorial workflow skills.",
    longDescription:
      "Writing workflows for natural prose, translation, illustration, cover images, structured proposals, and storytelling.",
    codexCategory: "Productivity",
    defaultPrompt: "Help me write or edit this content.",
  },
};

export const skillCatalog: Record<string, SkillCatalogEntry> = {
  "ai-avoid": {
    source: {
      kind: "upstream",
      repo: "https://github.com/ninehills/skills",
    },
  },
  "article-illustrator": {
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills",
    },
  },
  "cover-image": {
    source: {
      kind: "adapted",
      repo: "https://github.com/jimliu/baoyu-skills",
    },
  },
};
