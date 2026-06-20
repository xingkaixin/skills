export interface FaqItem {
  question: string;
  answer: string;
}

// Visible FAQ and FAQPage schema share this source so their text matches exactly.
export const faqItems: FaqItem[] = [
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
      "Run npx skills add xingkaixin/skills --skill agent-dump, swapping agent-dump for any skill slug. Only that skill is installed, which keeps your agent's context lean when you need just one capability.",
  },
  {
    question: "Which AI tools are supported?",
    answer:
      "These skills target Claude Code and other agents that follow the open Agent Skills format. Any coding tool able to read a SKILL.md instruction file can load them, so the catalog stays portable across compatible AI assistants.",
  },
];
