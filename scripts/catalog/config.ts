import type { LocalizedText } from "./locales.ts";
import type { SkillCatalogEntry } from "./types.ts";

export const SITE_NAME = "xingkaixin/skills";
export const SITE_REPO = "https://github.com/xingkaixin/skills";
export const MODS_REPO = "https://github.com/xingkaixin/claude-mods";
export const SITE_URL = "https://skills.xingkaixin.me";
export const AUTHOR_SITE_URL = "https://xingkaixin.me/";
export const SKILLS_INSTALL_SOURCE = "xingkaixin/skills";

export interface CategoryMetadata {
  webTitle: LocalizedText;
  webDescription: LocalizedText;
  webGuide: LocalizedText;
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
    webGuide: {
      en: "Use these skills in Claude Code, Codex, or Cursor when starting a new CLI, Go service, or monorepo, or when parsing coding-agent session logs. Each skill installs individually via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中新建 CLI、Go 服务、Monorepo 架构，或解析编程 Agent 本地会话日志时按需加载。每个技能都支持用 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor で CLI やモダンな Go 開発、モノレポ設計、エージェントのセッション解析を行う場面向けです。各スキルは npx skills add で個別に導入できます。",
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
    webGuide: {
      en: "Use these skills in Claude Code, Codex, or Cursor to standardize Git commit messages and keep Chinese and English release changelogs in sync across version bumps. Install only the workflow you need via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中统一 Git 提交信息规范、同步维护中英文更新日志并完成版本发布。每个技能都可以用 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor で Git コミット規約を揃え、中英のリリースノート同期やバージョン公開を進める場面向けです。必要なスキルだけ npx skills add で導入できます。",
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
      en: "Deploy to Cloudflare Pages or Workers and migrate from Vercel with Claude Code and Codex skills covering Wrangler config, secrets, storage, and checks.",
      zh: "使用 Claude Code 和 Codex 技能部署到 Cloudflare Pages 或 Workers，或从 Vercel 迁移，涵盖 Wrangler 配置、密钥、存储与部署检查。",
      ja: "Claude Code と Codex 向けのスキルで Cloudflare Pages・Workers へデプロイし、Vercel から移行します。Wrangler 設定、シークレット、ストレージ、検証を扱います。",
    },
    webGuide: {
      en: "Use this skill in Claude Code, Codex, or Cursor when moving a static site, Next.js app, or full-stack worker onto Cloudflare with D1, KV, and Wrangler. Install it directly with npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中将静态站点、Next.js 或全栈应用迁移到 Cloudflare Pages / Workers 并配置 D1、KV 与 Wrangler。通过 npx skills add 一行命令即可安装。",
      ja: "Claude Code、Codex、Cursor で静的サイトや Next.js、D1/KV を使うフルスタックアプリを Cloudflare へ移行・デプロイする場面向けです。npx skills add でそのまま導入できます。",
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
    webGuide: {
      en: "Use these UI design skills in Claude Code, Codex, or Cursor when turning a design system into consistent components, tightening layout and typography, or rewriting unclear error copy. Each skill installs with one npx skills add command.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中按设计系统实现界面、评审视觉层级与排版配色，以及改写产品错误提示文案。支持通过 npx skills add 按需单独安装。",
      ja: "Claude Code、Codex、Cursor で UI デザインやデザインシステムに沿った画面実装、レイアウト・書体・配色の見直し、エラー文言の改善を行う場面向けです。各スキルは npx skills add で個別に導入できます。",
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
      en: "Build Tauri menu bar agent apps and ship Electron releases with Claude Code and Codex skills for desktop integration, signing, updates, and distribution.",
      zh: "为 Claude Code 和 Codex 安装桌面开发技能，构建 Tauri 菜单栏应用，完成 Electron 打包、签名、公证与站外发布。",
      ja: "Claude Code と Codex 向けのデスクトップ開発スキル。Tauri のメニューバーエージェントアプリ構築や Electron の署名・公証・リリースを扱います。",
    },
    webGuide: {
      en: "Use these skills in Claude Code, Codex, or Cursor when building a macOS menu-bar app in Tauri v2 or packaging, signing, and notarizing an Electron release. Install individually with npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中用 Tauri v2 开发 macOS 菜单栏应用，或处理 Electron 站外分发的签名公证与密钥存储。每个技能都可用 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor で Tauri v2 の macOS メニューバーアプリ開発や、Electron アプリの署名・公証・ストア外配布を進める場面向けです。npx skills add で個別に導入できます。",
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
      en: "Prepare source-backed company research and A-share stock reports with a Claude Code and Codex skill covering financial statements, valuation, and risks.",
      zh: "使用 Claude Code 和 Codex 技能整理有来源依据的公司研究与 A 股股票报告，涵盖财务报表、估值、风险与报告结构。",
      ja: "Claude Code と Codex 向けの株式調査スキル。財務諸表、バリュエーション、リスク整理から出典付きの企業分析・株式レポートを作成します。",
    },
    webGuide: {
      en: "Use this skill in Claude Code, Codex, or Cursor to collect stock fundamentals, review financial metrics, and produce structured HTML research reports for company analysis. Install it with npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中按固定流程拉取个股财务与行情数据、梳理估值与风险，并输出统一版式的公司研究报告。使用 npx skills add 即可安装。",
      ja: "Claude Code、Codex、Cursor で銘柄分析や財務指標の確認、バリュエーションとリスクの整理を定型化し、HTML 形式の株式レポートを作成する場面向けです。npx skills add で導入できます。",
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
    webGuide: {
      en: "Use these React and frontend skills in Claude Code, Codex, or Cursor when choosing between local state, Context, Zustand, or React Query, or profiling large-dataset rendering bottlenecks. Install individually via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中做 React 状态管理选型，或用 benchmark 排查大文件、流式数据与长列表的前端性能瓶颈。支持通过 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor で React の状態管理（Context・Zustand・React Query 等）を選定したり、大量データやストリーミング描画の性能を改善したりする場面向けです。npx skills add で個別に導入できます。",
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
      en: "Build iOS audio recording, on-device vision and ML, and widgets with Claude Code and Codex skills for Apple platform integration and App Store shipping.",
      zh: "为 Claude Code 和 Codex 安装 iOS 开发技能，实现录音集成、端侧视觉与机器学习、WidgetKit 小组件与 App Store 过审发布。",
      ja: "Claude Code と Codex 向けの iOS アプリ開発スキル。録音連携、オンデバイス画像認識・ML、WidgetKit、App Store 公開準備を扱います。",
    },
    webGuide: {
      en: "Use these iOS app skills in Claude Code, Codex, or Cursor when wiring Live Activities and Action Button recording, building Vision and CoreML pipelines, or shipping WidgetKit extensions through App Store review. Install via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中开发 iOS 灵动岛与后台录音、端侧 Vision / 机器学习识别，以及 WidgetKit 扩展与 App Store 审核排坑。每个技能均可通过 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor で iOS アプリの Live Activity・録音連携、Vision を使った端末内画像認識、WidgetKit と App Store 審査対応を進める場面向けです。各スキルは npx skills add で個別に導入できます。",
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
    webGuide: {
      en: "Use these workflow skills in Claude Code, Codex, or Cursor to run layered code reviews, audit codebases iteratively, write decision-complete plans, track repo-local Markdown issues, or author new agent skills. Install individually via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中执行分层代码审查、持续改进代码库、编写可直接落地的实施计划、管理仓库内 Markdown issue，或编写新的 Agent Skill。均支持 npx skills add 单独安装。",
      ja: "Claude Code、Codex、Cursor でコードレビュー、コードベース監査、実装計画の作成、Markdown による課題管理、新しい Agent Skills の設計を行う場面向けです。各スキルは npx skills add で個別に導入できます。",
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
    webGuide: {
      en: "Use these writing skills in Claude Code, Codex, or Cursor to strip AI clichés from prose, translate English to natural Chinese, draft technical design docs, or generate article illustration and cover prompts. Install individually via npx skills add.",
      zh: "适合在 Claude Code、Codex 或 Cursor 中去除文章里的 AI 腔与翻译腔、打磨技术写作结构、深度精读长文，或生成文章配图与封面提示词。支持通过 npx skills add 按需安装。",
      ja: "Claude Code、Codex、Cursor で文章から AI っぽさを取り除く推敲、自然な翻訳、技術記事の構成・精読、記事の図解やカバー画像のプロンプト作成を行う場面向けです。npx skills add で個別に導入できます。",
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
