import type { LocalizedText } from "@/i18n/config";

interface RelatedSkill {
  slug: string;
  reason: LocalizedText;
}

export const relatedSkills: Record<string, RelatedSkill[]> = {
  "code-review-checklist": [{
    slug: "codebase-review-loop",
    reason: {
      en: "Turn review findings into tracked proposals and verify each fix.",
      zh: "把审查发现整理成可跟踪的改进提案，逐项修复并验证。",
      ja: "レビューの指摘を追跡できる改善提案にまとめ、一件ずつ修正・検証する。",
    },
  }],
  "codebase-review-loop": [{
    slug: "code-review-checklist",
    reason: {
      en: "Review each proposed change for design, call sites and behavior before closing a finding.",
      zh: "关闭改进项前，按设计、调用点和实际行为审查对应代码变更。",
      ja: "改善項目を完了する前に、設計・呼び出し箇所・動作の観点で差分をレビューする。",
    },
  }],
  "issue-tracker": [{
    slug: "issue-driven-dev-loop",
    reason: {
      en: "Take a tracked issue through implementation, verification and a pull request.",
      zh: "把已记录的需求推进到实施、验证和提交 PR。",
      ja: "登録した課題を実装・検証・プルリクエストまで進める。",
    },
  }],
  "issue-driven-dev-loop": [{
    slug: "issue-tracker",
    reason: {
      en: "Set up local Markdown issues, milestones and status tracking for your development loop.",
      zh: "为开发流程建立本地 Markdown 需求、里程碑和状态跟踪。",
      ja: "開発フローに必要な Markdown の課題・マイルストーン・状態管理を整える。",
    },
  }],
  "article-illustrator": [{
    slug: "cover-image",
    reason: {
      en: "Need a cover as well as inline illustrations? Create a separate cover image prompt.",
      zh: "正文配图之外还需要封面时，单独生成封面图片提示词。",
      ja: "本文の図解に加えてカバーも必要なら、専用の画像プロンプトを作る。",
    },
  }],
  "cover-image": [{
    slug: "article-illustrator",
    reason: {
      en: "Plan illustrations inside the article and write prompts for each visual explanation.",
      zh: "继续规划文章内部的配图位置，为需要图解的内容生成提示词。",
      ja: "記事本文の図解位置を決め、説明に合う画像プロンプトを作る。",
    },
  }],
};
