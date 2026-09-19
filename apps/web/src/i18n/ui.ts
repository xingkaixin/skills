import type { Locale } from "@/i18n/config";

export interface FaqItem {
  question: string;
  answer: string;
}

// English is the source shape: every other locale must satisfy UiStrings, so a
// missing key is a type error rather than a blank spot on the page.
const en = {
  skipToContent: "Skip to main content",
  siteTagline: "AI Agent Skill Catalog",
  siteDescription:
    "Install AI agent skills for Claude Code and Codex. Browse reusable instructions for code review, frontend development, writing, design, and releases.",
  header: {
    categories: "Categories",
    faq: "FAQ",
    search: "Search",
    searchSkills: "Search skills",
    repository: "GitHub",
    language: "Language",
  },
  home: {
    eyebrow: "Agent skills catalog",
    heading: "Agent skills for coding, writing and design.",
    intro: (count: number) =>
      `${count} installable skills for Claude Code and Codex, covering code review, frontend development, writing, design and releases. Choose a task and copy its install command.`,
    installAll: "Install the whole catalog",
    installOne: "or add one:",
    faqHeading: "FAQ",
  },
  catalog: {
    searchPlaceholder: "Search skills, e.g. release, iOS, commit",
    sortLabel: "Sort skills",
    sortRecent: "Recent",
    sortAlphabetical: "A–Z",
    filterLabel: "Filter by category",
    all: "All",
    count: (count: number) => `${count} ${count === 1 ? "skill" : "skills"}`,
    empty: "No skill matches this filter.",
    updated: (date: string) => `updated ${date}`,
  },
  skill: {
    breadcrumbRoot: "skills",
    added: "Added",
    updated: "Updated",
    source: "Source",
    repository: "Repo",
    onThisPage: "On this page",
    nextSteps: "Continue this task",
    moreIn: (category: string) => `More in ${category}`,
    writtenInChinese: "This skill is written in Chinese.",
    writtenInEnglish: "This skill is written in English.",
  },
  copy: {
    action: "Copy",
    done: "Copied",
  },
  notFound: {
    heading: "Page not found",
    back: "Back to catalog",
  },
  faq: [
    {
      question: "What is an agent skill?",
      answer:
        "An agent skill is a packaged set of instructions and references that teaches an AI coding agent—like Claude Code—how to perform a specific task. Each skill loads on demand, giving the agent focused expertise for frontend, backend, writing, design, and more.",
    },
    {
      question: "How do I install every skill in this catalog?",
      answer:
        "Run npx skills add xingkaixin/skills in your terminal. The command downloads the full catalog and installs each skill into your AI coding tool, making all of them available to your agent at once. No extra configuration is required.",
    },
    {
      question: "How do I install a single skill?",
      answer:
        "Run npx skills add xingkaixin/skills --skill react-state-management-decisions, swapping react-state-management-decisions for any skill slug. Only that skill is installed, which keeps your agent's context lean when you need just one capability.",
    },
    {
      question: "Which AI tools are supported?",
      answer:
        "These skills target Claude Code, Codex and other agents that follow the open Agent Skills format. Any coding tool able to read a SKILL.md instruction file can load them, so the catalog stays portable across compatible AI assistants.",
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
    categories: "分类",
    faq: "常见问题",
    search: "搜索",
    searchSkills: "搜索 skill",
    repository: "GitHub",
    language: "语言",
  },
  home: {
    eyebrow: "Agent 技能目录",
    heading: "编程、写作与设计的 Agent Skills。",
    intro: (count: number) =>
      `${count} 个可安装的技能，适用于 Claude Code 和 Codex，涵盖代码审查、前端开发、写作、设计与发布。找到要完成的任务，复制命令即可安装。`,
    installAll: "安装整个目录",
    installOne: "或只装一个：",
    faqHeading: "常见问题",
  },
  catalog: {
    searchPlaceholder: "搜索 skill，例如 release、iOS、commit",
    sortLabel: "排序方式",
    sortRecent: "最近更新",
    sortAlphabetical: "A–Z",
    filterLabel: "按分类筛选",
    all: "全部",
    count: (count: number) => `${count} 个 skill`,
    empty: "没有符合条件的 skill。",
    updated: (date: string) => `更新于 ${date}`,
  },
  skill: {
    breadcrumbRoot: "skills",
    added: "创建",
    updated: "更新",
    source: "来源",
    repository: "仓库",
    onThisPage: "本页目录",
    nextSteps: "继续完成任务",
    moreIn: (category: string) => `${category} 分类下的更多 skill`,
    writtenInChinese: "本 skill 正文为中文。",
    writtenInEnglish: "本 skill 正文为英文。",
  },
  copy: {
    action: "复制",
    done: "已复制",
  },
  notFound: {
    heading: "页面不存在",
    back: "返回目录",
  },
  faq: [
    {
      question: "什么是 agent skill？",
      answer:
        "agent skill 是一个打包好的指令与参考资料集合，教会 Claude Code 这类 AI 编程 agent 如何完成某项具体任务。每个 skill 按需加载，让 agent 在前端、后端、写作、设计等方向获得专项能力。",
    },
    {
      question: "如何安装目录里的全部 skill？",
      answer:
        "在终端运行 npx skills add xingkaixin/skills。这条命令会下载完整目录，把每个 skill 都装进你的 AI 编程工具，一次性全部可用，无需额外配置。",
    },
    {
      question: "如何只安装单个 skill？",
      answer:
        "运行 npx skills add xingkaixin/skills --skill react-state-management-decisions，把 react-state-management-decisions 换成任意 skill 的 slug 即可。只装这一个，能让 agent 的 context 保持精简。",
    },
    {
      question: "支持哪些 AI 工具？",
      answer:
        "这些 skill 面向 Claude Code、Codex 以及其他遵循开放 Agent Skills 格式的 agent。任何能读取 SKILL.md 指令文件的编程工具都能加载，因此目录可以在兼容的 AI 助手之间通用。",
    },
  ],
};

const ja: UiStrings = {
  skipToContent: "本文へスキップ",
  siteTagline: "AI エージェント スキルカタログ",
  siteDescription:
    "Claude Code と Codex 向けの Agent Skills を探してインストール。コードレビュー、フロントエンド開発、執筆、デザイン、リリースに使える手順を収録。",
  header: {
    categories: "カテゴリ",
    faq: "よくある質問",
    search: "検索",
    searchSkills: "スキルを検索",
    repository: "GitHub",
    language: "言語",
  },
  home: {
    eyebrow: "エージェント スキルカタログ",
    heading: "開発・執筆・デザインのための Agent Skills。",
    intro: (count: number) =>
      `Claude Code と Codex 向けのスキルを ${count} 件収録。コードレビュー、フロントエンド開発、執筆、デザイン、リリースから必要な作業を選び、コマンドをコピーして導入できます。`,
    installAll: "カタログ全体をインストール",
    installOne: "個別に追加する場合:",
    faqHeading: "よくある質問",
  },
  catalog: {
    searchPlaceholder: "スキルを検索（例: release、iOS、commit）",
    sortLabel: "並べ替え",
    sortRecent: "更新順",
    sortAlphabetical: "A–Z",
    filterLabel: "カテゴリで絞り込む",
    all: "すべて",
    count: (count: number) => `${count} 件のスキル`,
    empty: "条件に一致するスキルはありません。",
    updated: (date: string) => `更新 ${date}`,
  },
  skill: {
    breadcrumbRoot: "skills",
    added: "追加日",
    updated: "更新日",
    source: "提供元",
    repository: "リポジトリ",
    onThisPage: "目次",
    nextSteps: "次の作業へ",
    moreIn: (category: string) => `${category} の他のスキル`,
    writtenInChinese: "このスキルの本文は中国語です。",
    writtenInEnglish: "このスキルの本文は英語です。",
  },
  copy: {
    action: "コピー",
    done: "コピーしました",
  },
  notFound: {
    heading: "ページが見つかりません",
    back: "カタログに戻る",
  },
  faq: [
    {
      question: "agent skill とは何ですか?",
      answer:
        "agent skill は、Claude Code のような AI コーディングエージェントに特定の作業のやり方を教える、指示と参考資料をまとめたパッケージです。必要なときだけ読み込まれ、フロントエンドやバックエンド、ライティング、デザインなどの専門知識を与えます。",
    },
    {
      question: "カタログ内のすべてのスキルを入れるには?",
      answer:
        "ターミナルで npx skills add xingkaixin/skills を実行してください。カタログ全体をダウンロードし、各スキルを AI コーディングツールへ導入します。追加の設定は不要です。",
    },
    {
      question: "スキルを一つだけ入れるには?",
      answer:
        "npx skills add xingkaixin/skills --skill react-state-management-decisions を実行し、react-state-management-decisions を任意のスキルの slug に置き換えてください。必要な一つだけを入れることで、エージェントのコンテキストを軽く保てます。",
    },
    {
      question: "どの AI ツールに対応していますか?",
      answer:
        "これらのスキルは Claude Code、Codex と、オープンな Agent Skills 形式に従う他のエージェントを対象としています。SKILL.md を読めるコーディングツールなら読み込めるため、互換性のある AI アシスタント間で持ち運べます。",
    },
  ],
};

export const ui: Record<Locale, UiStrings> = { en, zh, ja };
