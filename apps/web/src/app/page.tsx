import { Suspense } from "react";
import { SkillList } from "@/app/skill-list";
import { SiteBrand } from "@/app/brand";
import { SITE_REPO, SITE_URL } from "@/data/catalog";
import { getSkills, getSkillTags } from "@/data/skills";

const PAGE_TITLE = "XingKaiXin's Skills — AI Agent Skill Catalog";
const PAGE_DESC = "Browse and install AI agent skills for Claude Code and other AI coding tools. A curated catalog covering frontend, backend, writing, design, and more.";

export function Home() {
  const skills = getSkills();
  const tags = getSkillTags();

  return (
    <div className="min-h-screen">
      <title>{PAGE_TITLE}</title>
      <meta name="description" content={PAGE_DESC} />
      <link rel="canonical" href={SITE_URL} />
      <meta property="og:title" content={PAGE_TITLE} />
      <meta property="og:description" content={PAGE_DESC} />
      <meta property="og:url" content={SITE_URL} />
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <SiteBrand />
          <a
            href={SITE_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-text hover:text-text"
          >
            GitHub
          </a>
        </div>
      </nav>

      <div className="border-b border-border px-6 py-2">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs text-text-muted">
            xingkaixin&nbsp;/&nbsp;<span className="text-text-secondary font-medium">skills</span>
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-8">
        <h1 className="font-semibold text-xl text-text">xingkaixin/skills</h1>
        <p className="mt-1.5 text-sm text-text-secondary">Agent skills for AI Agents</p>

        <div className="mt-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Usage</p>

          <div>
            <p className="mb-1.5 text-xs text-text-muted">Install all skills</p>
            <div className="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
              <code className="font-mono text-sm text-text">npx skills add xingkaixin/skills</code>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-text-muted">Install a single skill</p>
            <div className="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
              <code className="font-mono text-sm text-text">npx skills add xingkaixin/skills --skill agent-dump</code>
            </div>
          </div>
        </div>

        <hr className="my-8 border-border" />

        <Suspense>
          <SkillList skills={skills} tags={tags} />
        </Suspense>
      </main>
    </div>
  );
}
