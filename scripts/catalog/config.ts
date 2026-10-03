import type { LocalizedText } from "./locales.ts";
import type { SkillCatalogEntry } from "./types.ts";

export const SITE_NAME = "xingkaixin/skills";
export const SITE_REPO = "https://github.com/xingkaixin/skills";
export const SITE_URL = "https://skills.xingkaixin.me";
export const SKILLS_INSTALL_SOURCE = "xingkaixin/skills";

export interface CategoryMetadata {
  webTitle: LocalizedText;
  webDescription: LocalizedText;
  description: string;
  displayName: string;
  shortDescription: string;
  longDescription: string;
  codexCategory: "Developer Tools" | "Productivity";
  defaultPrompt: string;
}

export const categoryMetadata: Record<string, CategoryMetadata> = {
  backend: {
    webTitle: {
      en: "Backend and CLI skills",
      zh: "后端与 CLI 开发技能",
      ja: "バックエンド・CLI 開発スキル",
    },
    webDescription: {
      en: "Build agent-friendly CLIs, choose a project stack, organize a monorepo, and write modern Go with reusable skills for Claude Code and Codex.",
      zh: "用 Claude Code 和 Codex 技能设计 Agent 友好的 CLI、选择技术栈、组织 Monorepo，并编写现代 Go 代码。",
      ja: "Claude Code と Codex 向けのスキルで、CLI 設計、技術スタック選定、モノレポ構成、モダンな Go 開発を進めます。",
    },
    description: "Backend engineering, CLI, architecture, scaffolding, and Go skills",
    displayName: "Backend Skills",
    shortDescription: "Backend engineering and architecture skills.",
    longDescription:
      "Backend engineering workflows for CLIs, architecture, project scaffolding, and modern Go.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me solve this backend engineering task.",
  },
  ci: {
    webTitle: {
      en: "Git commit and release skills",
      zh: "Git 提交与发布技能",
      ja: "Git コミット・リリーススキル",
    },
    webDescription: {
      en: "Write consistent Git commit messages and bilingual release notes. Install skills for Claude Code and Codex to prepare version changes and releases.",
      zh: "为 Claude Code 和 Codex 安装 Git 提交与发布技能，编写规范提交信息、整理双语更新日志，并完成版本发布。",
      ja: "Claude Code と Codex で、一貫した Git コミットメッセージと二言語のリリースノートを作成し、バージョン更新を進めます。",
    },
    description: "Release changelog and Git commit workflow skills",
    displayName: "CI Skills",
    shortDescription: "Release and commit workflow skills.",
    longDescription:
      "Continuous integration workflows for bilingual release changelogs and consistent Git commits.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me prepare this release or Git commit.",
  },
  deploy: {
    webTitle: {
      en: "Cloudflare deployment skills",
      zh: "Cloudflare 部署技能",
      ja: "Cloudflare デプロイスキル",
    },
    webDescription: {
      en: "Deploy to Cloudflare Pages or Workers and migrate from Vercel. Use an agent skill covering Wrangler configuration, secrets, storage, and deployment checks.",
      zh: "使用 Agent 技能部署到 Cloudflare Pages 或 Workers，或从 Vercel 迁移，涵盖 Wrangler 配置、密钥、存储与部署检查。",
      ja: "Cloudflare Pages・Workers へのデプロイと Vercel からの移行に使うスキル。Wrangler 設定、シークレット、ストレージ、検証を扱います。",
    },
    description: "Cloud deployment and platform migration skills",
    displayName: "Deploy Skills",
    shortDescription: "Cloud deployment and migration skills.",
    longDescription:
      "Deployment workflows for Cloudflare platforms and migrations from Vercel.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me deploy or migrate this application.",
  },
  design: {
    webTitle: {
      en: "UI and visual design skills",
      zh: "UI 与视觉设计技能",
      ja: "UI・ビジュアルデザインスキル",
    },
    webDescription: {
      en: "Improve layout, typography, color, and error messages. Apply a design system with Claude Code and Codex skills for clearer product interfaces.",
      zh: "通过 Claude Code 和 Codex 技能改善布局、字体、配色和错误提示，依据设计系统实现信息清晰的产品界面。",
      ja: "Claude Code と Codex 向けのスキルで、レイアウト、書体、配色、エラーメッセージを改善し、デザインシステムに沿った UI を作ります。",
    },
    description: "Visual design, design system, and interface writing skills",
    displayName: "Design Skills",
    shortDescription: "Visual design, design systems, and interface writing.",
    longDescription:
      "Design workflows for visual hierarchy, layout, typography, color, input-driven design systems, and effective error messages.",
    codexCategory: "Productivity",
    defaultPrompt: "Help me improve this product design.",
  },
  desktop: {
    webTitle: {
      en: "Electron and Tauri skills",
      zh: "Electron 与 Tauri 桌面开发技能",
      ja: "Electron・Tauri 開発スキル",
    },
    webDescription: {
      en: "Build Tauri menu bar agent apps and ship Electron releases. Browse agent skills for desktop integration, packaging, updates, and distribution.",
      zh: "浏览桌面开发 Agent 技能，构建 Tauri 菜单栏应用，完成 Electron 应用打包、更新与发布，处理桌面系统集成。",
      ja: "Tauri のメニューバーエージェントアプリと Electron のリリースに使うスキル。デスクトップ連携、パッケージ化、更新、配布を扱います。",
    },
    description: "Electron and Tauri desktop application skills",
    displayName: "Desktop Skills",
    shortDescription: "Electron and Tauri application skills.",
    longDescription:
      "Desktop application workflows for Electron releases and Tauri menubar agents.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me build or release this desktop app.",
  },
  finance: {
    webTitle: {
      en: "Stock research skills",
      zh: "股票研究技能",
      ja: "株式調査スキル",
    },
    webDescription: {
      en: "Prepare source-backed company research and stock reports with an agent skill covering financial statements, valuation, risks, and report structure.",
      zh: "使用 Agent 技能整理有来源依据的公司研究与股票报告，涵盖财务报表、估值、风险和报告结构。",
      ja: "財務諸表、バリュエーション、リスク、レポート構成を扱うスキルで、出典を確認できる企業調査と株式レポートを作成します。",
    },
    description: "Financial research and reporting skills",
    displayName: "Finance Skills",
    shortDescription: "Financial research and reporting skills.",
    longDescription:
      "Financial analysis workflows for researching companies and producing stock reports.",
    codexCategory: "Productivity",
    defaultPrompt: "Research this company and prepare a stock report.",
  },
  frontend: {
    webTitle: {
      en: "React and frontend performance skills",
      zh: "React 与前端性能技能",
      ja: "React・フロントエンド性能スキル",
    },
    webDescription: {
      en: "Choose React state management and improve large-data frontend performance. Install Claude Code and Codex skills for state ownership and rendering decisions.",
      zh: "为 Claude Code 和 Codex 安装前端技能，选择 React 状态管理方式，明确状态归属，优化大数据量页面的渲染与交互性能。",
      ja: "React の状態管理と大量データを扱う画面の性能改善に使うスキル。Claude Code と Codex で状態の配置と描画方法を検討します。",
    },
    description: "Frontend performance and state management skills",
    displayName: "Frontend Skills",
    shortDescription: "Frontend performance and state skills.",
    longDescription:
      "Frontend engineering workflows for large data performance and React state management decisions.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me solve this frontend engineering task.",
  },
  ios: {
    webTitle: {
      en: "iOS development and release skills",
      zh: "iOS 开发与上架技能",
      ja: "iOS 開発・公開スキル",
    },
    webDescription: {
      en: "Build iOS audio recording, on-device vision and ML, and widgets. Use agent skills for Apple platform integration and App Store release preparation.",
      zh: "浏览 iOS Agent 技能，实现录音、端侧视觉与机器学习、小组件，完成 Apple 平台集成与 App Store 上架准备。",
      ja: "iOS の録音、オンデバイス画像認識・機械学習、ウィジェットを実装するスキル。Apple プラットフォーム連携と App Store 公開準備に使えます。",
    },
    description: "iOS vision, recording, widget, and App Store delivery skills",
    displayName: "iOS Skills",
    shortDescription: "iOS platform and delivery skills.",
    longDescription:
      "iOS engineering workflows for on-device ML, recording integrations, widgets, and App Store delivery.",
    codexCategory: "Developer Tools",
    defaultPrompt: "Help me implement or ship this iOS feature.",
  },
  workflow: {
    webTitle: {
      en: "Code review and planning skills",
      zh: "代码审查与开发规划技能",
      ja: "コードレビュー・開発計画スキル",
    },
    webDescription: {
      en: "Review code, plan implementation, track issues, and write agent skills. Browse repeatable engineering workflows for Claude Code and Codex.",
      zh: "浏览适用于 Claude Code 和 Codex 的开发流程技能，完成代码审查、实施规划、需求与缺陷跟踪，以及 Agent Skills 编写。",
      ja: "Claude Code と Codex 向けの開発ワークフロー。コードレビュー、実装計画、課題管理、Agent Skills の作成に使える手順を収録しています。",
    },
    description: "Code review, planning, issue tracking, and skill authoring workflows",
    displayName: "Workflow Skills",
    shortDescription: "Engineering and issue management workflows.",
    longDescription:
      "Structured workflows for code review, planning, issue tracking, implementation loops, and skill authoring.",
    codexCategory: "Productivity",
    defaultPrompt: "Help me plan and execute this engineering workflow.",
  },
  writing: {
    webTitle: {
      en: "Writing, translation and illustration skills",
      zh: "写作、翻译与配图技能",
      ja: "執筆・翻訳・図解スキル",
    },
    webDescription: {
      en: "Edit natural prose, translate literature, structure stories, and create article illustrations. Install reusable writing skills for Claude Code and Codex.",
      zh: "为 Claude Code 和 Codex 安装写作技能，去除 AI 写作套路、进行文学翻译、组织故事结构，并生成文章配图与封面提示词。",
      ja: "自然な文章への推敲、文芸翻訳、物語構成、記事の図解・カバー画像に使うスキル。Claude Code と Codex にインストールできます。",
    },
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
