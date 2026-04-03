"use client";

import { startTransition, useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { type SkillRecord } from "@/data/skill-record";

export function SkillList({
  skills,
  tags,
}: {
  skills: SkillRecord[];
  tags: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialTag = searchParams.get("tag");
  const [activeTag, setActiveTag] = useState<string>(initialTag && tags.includes(initialTag) ? initialTag : "all");
  const deferredTag = useDeferredValue(activeTag);

  const filteredSkills = useMemo(() => {
    if (deferredTag === "all") return skills;
    return skills.filter((skill) => skill.tags.includes(deferredTag));
  }, [deferredTag, skills]);

  function handleFilterChange(tag: string) {
    setActiveTag(tag);
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (tag === "all") {
        nextParams.delete("tag");
      } else {
        nextParams.set("tag", tag);
      }
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    });
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-bg border-b border-border flex flex-wrap items-center gap-2 mb-6">
        <FilterChip active={activeTag === "all"} onClick={() => handleFilterChange("all")}>
          All
        </FilterChip>
        {tags.map((tag) => (
          <FilterChip key={tag} active={activeTag === tag} onClick={() => handleFilterChange(tag)}>
            {tag}
          </FilterChip>
        ))}
        <span className="ml-auto text-xs text-text-muted">
          {filteredSkills.length} skills
        </span>
      </div>

      <div className="divide-y divide-border">
        {filteredSkills.map((skill) => (
          <Link
            key={skill.slug}
            href={`/skills/${skill.slug}`}
            className="flex items-baseline gap-6 py-3 px-1 transition-colors hover:bg-accent-soft group"

          >
            <span className="w-44 shrink-0 font-medium text-sm text-text truncate">
              {skill.slug}
            </span>
            <span className="flex-1 min-w-0 text-sm text-text-secondary truncate">
              {skill.description}
            </span>
            <span className="text-xs text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? "border-text bg-text text-white"
          : "border-border bg-transparent text-text-secondary hover:border-text hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
