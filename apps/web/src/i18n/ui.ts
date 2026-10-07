import type { Locale } from "@/i18n/config";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StepItem {
  title: string;
  body: string;
}

// English is the source shape: every other locale must satisfy UiStrings, so a
// missing key is a type error rather than a blank spot on the page.
const en = {
  skipToContent: "Skip to main content",
  siteTagline: "AI Agent Skill Catalog",
  siteDescription:
    "Install AI agent skills for Claude Code and Codex. Browse reusable instructions for code review, frontend development, writing, design, and releases.",
  header: {
    skills: "Skills",
    categories: "Categories",
    faq: "FAQ",
    search: "Search",
    searchSkills: "Search skills",
    repository: "GitHub",
    mods: "Claude Code Mods",
    language: "Language",
  },
  home: {
    badge: (count: number, date: string) => `${count} skills · updated ${date}`,
    heading: "Agent Skills for Claude Code and Codex",
    intro:
      "Reusable instructions that teach your coding agent how to review code, ship iOS and desktop apps, deploy to Cloudflare, and write clearly. Install the whole catalog with one command, or add only the skill you need.",
    installScope: "Install scope",
    installAll: "All skills",
    installOne: "One skill",
    installNote: "Works with any agent that reads the open Agent Skills format. No config files to edit.",
    exampleLabel: "What you install",
    exampleCaption: "The description tells the agent when to load the skill. The body is the procedure it follows.",
    categoriesHeading: "Browse skills by category",
    categoriesIntro: (count: number) =>
      `${count} areas of everyday engineering and writing work. Each category page lists its skills with install commands.`,
    skillsHeading: "All skills",
    skillsIntro: "Search by task, tool or platform. Every card links to the full SKILL.md and its install command.",
    howHeading: "How agent skills work",
    steps: [
      { title: "Install once", body: "One command adds every skill, or a single one, to the coding agent on your machine." },
      { title: "Loaded only when relevant", body: "The agent reads each skill's short description and opens the full instructions only when your task matches." },
      { title: "Same steps every time", body: "A review, a release or a migration follows a written procedure instead of whatever the model improvises that day." },
    ] as StepItem[],
    faqHeading: "Frequently asked questions",
    faqMore: "Something missing?",
    faqIssue: "Open an issue on GitHub",
  },
  footer: {
    tagline: "An open catalog of agent skills for Claude Code and Codex, maintained by XingKaiXin.",
    project: "Project",
    repository: "GitHub repository",
    issue: "Report an issue",
  },
  catalog: {
    searchPlaceholder: "Search skills, e.g. release, iOS, commit",
    sortLabel: "Sort skills",
    sortRecent: "Recently updated",
    sortAlphabetical: "A–Z",
    filterLabel: "Filter by category",
    all: "All",
    count: (count: number) => `${count} ${count === 1 ? "skill" : "skills"}`,
    empty: "No skill matches this search. Try a broader word or another category.",
    updated: (date: string) => `Updated ${date}`,
    sourceKinds: { self: "Original", upstream: "Upstream", adapted: "Adapted" },
  },
  skill: {
    breadcrumbRoot: "Skills",
    install: "Install this skill",
    added: "Added",
    updated: "Updated",
    writtenIn: "Written in",
    repository: "Repository",
    languages: { en: "English", "zh-CN": "Chinese" },
    onThisPage: "On this page",
    nextSteps: "Continue this task",
    moreIn: (category: string) => `More in ${category}`,
    writtenInChinese: "This SKILL.md is written in Chinese. Your agent follows it the same way and still answers in your language.",
    writtenInEnglish: "This SKILL.md is written in English. Your agent follows it the same way and still answers in your language.",
  },
  copy: {
    action: "Copy",
    done: "Copied",
    failed: "Copy failed",
  },
  notFound: {
    heading: "Page not found",
    back: "Back to catalog",
  },
  faq: [
    {
      question: "What is an agent skill?",
      answer:
        "A folder with a SKILL.md file: a short description that tells the agent when to use it, followed by step-by-step instructions and references. Claude Code, Codex and other compatible agents load a skill only when the task calls for it.",
    },
    {
      question: "How do I install every skill?",
      answer:
        "Run npx skills add xingkaixin/skills in your terminal. It installs the full catalog into your coding agent. No further configuration is needed.",
    },
    {
      question: "How do I install a single skill?",
      answer:
        "Add --skill with the skill's slug, for example npx skills add xingkaixin/skills --skill use-modern-go. Installing only what you need keeps the agent's context small.",
    },
    {
      question: "Which AI coding tools are supported?",
      answer:
        "Claude Code and Codex, plus any agent that reads the open Agent Skills format. The skills are plain Markdown, so they carry over between compatible tools.",
    },
    {
      question: "Some skills are written in Chinese. Do they still work?",
      answer:
        "Yes. The agent follows the instructions regardless of their language and replies in yours. Each skill page notes the language its SKILL.md is written in.",
    },
  ] as FaqItem[],
};

export type UiStrings = typeof en;

const zh: UiStrings = {
  skipToContent: "跳到主要内容",
  siteTagline: "AI Agent 技能目录",
  siteDescription:
    "浏览并安装适用于 Claude Code 和 Codex 的 Agent Skills，涵盖代码审查、前端开发、写作、设计与发布。按任务选择技能，复制命令即可安装。",
  header: {
    skills: "技能",
    categories: "分类",
    faq: "常见问题",
    search: "搜索",
    searchSkills: "搜索 skill",
    repository: "GitHub",
    mods: "Claude Code Mods",
    language: "语言",
  },
  home: {
    badge: (count: number, date: string) => `${count} 个 skill · 更新于 ${date}`,
    heading: "适用于 Claude Code 和 Codex 的 Agent Skills",
    intro:
      "可复用的指令集，教你的编程 Agent 审查代码、发布 iOS 与桌面应用、部署到 Cloudflare，以及写出清楚的文字。一条命令安装整个目录，也可以只装需要的那一个。",
    installScope: "安装范围",
    installAll: "全部技能",
    installOne: "单个技能",
    installNote: "适用于任何支持开放 Agent Skills 格式的 Agent，无需修改配置文件。",
    exampleLabel: "安装的内容",
    exampleCaption: "description 告诉 Agent 何时加载这个 skill，正文是它要执行的流程。",
    categoriesHeading: "按分类浏览",
    categoriesIntro: (count: number) =>
      `${count} 个日常开发与写作方向，每个分类页都列出其中的 skill 和安装命令。`,
    skillsHeading: "全部技能",
    skillsIntro: "按任务、工具或平台搜索。每张卡片都链接到完整的 SKILL.md 和安装命令。",
    howHeading: "Agent Skills 如何工作",
    steps: [
      { title: "安装一次", body: "一条命令把全部或单个 skill 装进你本机的编程 Agent。" },
      { title: "需要时才加载", body: "Agent 先读每个 skill 的简短描述，只有任务匹配时才打开完整指令。" },
      { title: "每次步骤一致", body: "代码审查、发布、迁移都按写好的流程执行，而不是让模型每次即兴发挥。" },
    ],
    faqHeading: "常见问题",
    faqMore: "没找到答案？",
    faqIssue: "在 GitHub 提 issue",
  },
  footer: {
    tagline: "适用于 Claude Code 和 Codex 的开源 Agent Skills 目录，由 XingKaiXin 维护。",
    project: "项目",
    repository: "GitHub 仓库",
    issue: "反馈问题",
  },
  catalog: {
    searchPlaceholder: "搜索 skill，例如 release、iOS、commit",
    sortLabel: "排序方式",
    sortRecent: "最近更新",
    sortAlphabetical: "A–Z",
    filterLabel: "按分类筛选",
    all: "全部",
    count: (count: number) => `${count} 个 skill`,
    empty: "没有符合条件的 skill。换个更宽泛的词，或切换分类试试。",
    updated: (date: string) => `更新于 ${date}`,
    sourceKinds: { self: "原创", upstream: "上游", adapted: "改编" },
  },
  skill: {
    breadcrumbRoot: "技能",
    install: "安装此技能",
    added: "创建",
    updated: "更新",
    writtenIn: "正文语言",
    repository: "仓库",
    languages: { en: "英文", "zh-CN": "中文" },
    onThisPage: "本页目录",
    nextSteps: "继续完成任务",
    moreIn: (category: string) => `${category} 分类下的更多 skill`,
    writtenInChinese: "本 skill 的 SKILL.md 用中文写成。Agent 照样按它执行，并用你的语言回复。",
    writtenInEnglish: "本 skill 的 SKILL.md 用英文写成。Agent 照样按它执行，并用你的语言回复。",
  },
  copy: {
    action: "复制",
    done: "已复制",
    failed: "复制失败",
  },
  notFound: {
    heading: "页面不存在",
    back: "返回目录",
  },
  faq: [
    {
      question: "什么是 agent skill？",
      answer:
        "一个包含 SKILL.md 的文件夹：开头是一段简短描述，告诉 Agent 什么时候使用它，后面是分步骤的指令和参考资料。Claude Code、Codex 等兼容的 Agent 只在任务需要时才加载它。",
    },
    {
      question: "如何安装全部 skill？",
      answer:
        "在终端运行 npx skills add xingkaixin/skills，即可把整个目录装进你的编程 Agent，无需额外配置。",
    },
    {
      question: "如何只安装单个 skill？",
      answer:
        "加上 --skill 和 skill 的 slug，例如 npx skills add xingkaixin/skills --skill use-modern-go。只装需要的 skill，能让 Agent 的 context 保持精简。",
    },
    {
      question: "支持哪些 AI 编程工具？",
      answer:
        "Claude Code 和 Codex，以及任何支持开放 Agent Skills 格式的 Agent。skill 本身是纯 Markdown，可以在兼容的工具之间通用。",
    },
    {
      question: "有些 skill 是中文写的，还能用吗？",
      answer:
        "能。Agent 会照指令执行，不受指令语言影响，并用你的语言回复。每个 skill 页面都会标出 SKILL.md 的书写语言。",
    },
  ],
};

const ja: UiStrings = {
  skipToContent: "本文へスキップ",
  siteTagline: "AI エージェント スキルカタログ",
  siteDescription:
    "Claude Code と Codex 向けの Agent Skills を探してインストール。コードレビュー、フロントエンド開発、執筆、デザイン、リリースに使える手順を収録。",
  header: {
    skills: "スキル",
    categories: "カテゴリ",
    faq: "よくある質問",
    search: "検索",
    searchSkills: "スキルを検索",
    repository: "GitHub",
    mods: "Claude Code Mods",
    language: "言語",
  },
  home: {
    badge: (count: number, date: string) => `${count} 件のスキル · ${date} 更新`,
    heading: "Claude Code と Codex のための Agent Skills",
    intro:
      "コードレビュー、iOS・デスクトップアプリのリリース、Cloudflare へのデプロイ、わかりやすい文章の書き方をコーディングエージェントに教える、再利用できる手順集です。カタログ全体を一つのコマンドで導入することも、必要なスキルだけを追加することもできます。",
    installScope: "インストール範囲",
    installAll: "すべてのスキル",
    installOne: "個別のスキル",
    installNote: "オープンな Agent Skills 形式を読み込めるエージェントで動作します。設定ファイルの編集は不要です。",
    exampleLabel: "インストールされる内容",
    exampleCaption: "description はスキルを読み込むタイミングをエージェントに伝え、本文はエージェントが従う手順です。",
    categoriesHeading: "カテゴリから探す",
    categoriesIntro: (count: number) =>
      `日々の開発と執筆に関わる ${count} 分野。各カテゴリページにスキルとインストールコマンドをまとめています。`,
    skillsHeading: "すべてのスキル",
    skillsIntro: "作業内容、ツール、プラットフォームで検索できます。各カードから SKILL.md 全文とインストールコマンドを確認できます。",
    howHeading: "Agent Skills の仕組み",
    steps: [
      { title: "一度インストール", body: "一つのコマンドで、全スキルまたは単体のスキルを手元のコーディングエージェントに追加します。" },
      { title: "必要なときだけ読み込む", body: "エージェントは各スキルの短い説明を読み、作業が一致したときだけ手順の全文を開きます。" },
      { title: "毎回同じ手順で", body: "レビュー、リリース、移行を、その場の思いつきではなく書かれた手順どおりに進めます。" },
    ],
    faqHeading: "よくある質問",
    faqMore: "答えが見つからない場合は",
    faqIssue: "GitHub で Issue を作成",
  },
  footer: {
    tagline: "Claude Code と Codex 向けのオープンな Agent Skills カタログ。XingKaiXin が管理しています。",
    project: "プロジェクト",
    repository: "GitHub リポジトリ",
    issue: "問題を報告",
  },
  catalog: {
    searchPlaceholder: "スキルを検索（例: release、iOS、commit）",
    sortLabel: "並べ替え",
    sortRecent: "更新順",
    sortAlphabetical: "A–Z",
    filterLabel: "カテゴリで絞り込む",
    all: "すべて",
    count: (count: number) => `${count} 件のスキル`,
    empty: "条件に一致するスキルはありません。より広い語句や別のカテゴリで試してください。",
    updated: (date: string) => `更新 ${date}`,
    sourceKinds: { self: "オリジナル", upstream: "上流", adapted: "改変" },
  },
  skill: {
    breadcrumbRoot: "スキル",
    install: "このスキルをインストール",
    added: "追加日",
    updated: "更新日",
    writtenIn: "本文の言語",
    repository: "リポジトリ",
    languages: { en: "英語", "zh-CN": "中国語" },
    onThisPage: "目次",
    nextSteps: "次の作業へ",
    moreIn: (category: string) => `${category} の他のスキル`,
    writtenInChinese: "この SKILL.md は中国語で書かれています。エージェントは同じように手順に従い、あなたの言語で応答します。",
    writtenInEnglish: "この SKILL.md は英語で書かれています。エージェントは同じように手順に従い、あなたの言語で応答します。",
  },
  copy: {
    action: "コピー",
    done: "コピーしました",
    failed: "コピーできませんでした",
  },
  notFound: {
    heading: "ページが見つかりません",
    back: "カタログに戻る",
  },
  faq: [
    {
      question: "agent skill とは何ですか?",
      answer:
        "SKILL.md を含むフォルダです。冒頭の短い説明がエージェントに使うタイミングを伝え、その後に手順と参考資料が続きます。Claude Code や Codex などの対応エージェントは、作業に必要なときだけスキルを読み込みます。",
    },
    {
      question: "すべてのスキルを入れるには?",
      answer:
        "ターミナルで npx skills add xingkaixin/skills を実行してください。カタログ全体がコーディングエージェントに導入されます。追加の設定は不要です。",
    },
    {
      question: "スキルを一つだけ入れるには?",
      answer:
        "--skill にスキルの slug を指定します。例: npx skills add xingkaixin/skills --skill use-modern-go。必要なものだけを入れると、エージェントのコンテキストを小さく保てます。",
    },
    {
      question: "どの AI コーディングツールに対応していますか?",
      answer:
        "Claude Code と Codex、そしてオープンな Agent Skills 形式を読み込めるエージェントに対応しています。スキルはプレーンな Markdown なので、対応ツール間でそのまま使えます。",
    },
    {
      question: "中国語で書かれたスキルも使えますか?",
      answer:
        "使えます。エージェントは指示の言語に関係なく手順に従い、あなたの言語で応答します。各スキルページに SKILL.md の記述言語を表示しています。",
    },
  ],
};

export const ui: Record<Locale, UiStrings> = { en, zh, ja };
