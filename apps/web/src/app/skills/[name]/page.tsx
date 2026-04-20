import { SiteBrand } from "@/app/brand";
import { getSkill } from "@/data/skills";
import { formatRepoLabel } from "@/data/skill-record";
import { Link, useParams, Navigate } from "react-router-dom";

export function SkillDetail() {
  const { name } = useParams<{ name: string }>();
  const skill = name ? getSkill(name) : undefined;

  if (!skill) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <SiteBrand subtle />
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-text hover:text-text"
          >
            Catalog
          </Link>
        </div>
      </nav>

      <div className="border-b border-border px-6 py-2">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs text-text-muted">
            <Link to="/" className="transition hover:text-text-secondary">
              xingkaixin&nbsp;/&nbsp;skills
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-text-secondary font-medium">{skill.slug}</span>
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-semibold text-2xl text-text">
              {skill.slug}
            </h1>

            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Install</p>
              <div className="inline-flex items-center rounded-md border border-border bg-[#f6f8fa] px-4 py-2.5">
                <code className="font-mono text-sm text-text">
                  npx skills add xingkaixin/skills --skill {skill.slug}
                </code>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-text-secondary">
              {skill.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/?tag=${tag}`}
                  className="tag-pill hover:border-text hover:text-text"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <aside className="lg:w-56 lg:shrink-0">
            <div className="rounded-md border border-border p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-muted">Source Repo</p>
              <div className="mt-3">
                <a
                  href={skill.sourceRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text underline underline-offset-4 transition hover:text-text-secondary"
                >
                  {formatRepoLabel(skill.sourceRepo)}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
