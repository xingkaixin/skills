import assert from "node:assert/strict";
import test from "node:test";
import {
  getInstallCommand,
  getSkillDetails,
  matchesSkillQuery,
  searchSkills,
} from "../apps/web/src/data/skill-catalog.ts";
import type { SkillRecord } from "../scripts/catalog/types.ts";

const skills: SkillRecord[] = [
  {
    slug: "release-helper",
    name: "release-helper",
    description: "Prepare bilingual release notes and publish a version.",
    displayDescription: {
      en: "Ship releases in two languages.",
      zh: "同步发布双语版本。",
      ja: "二言語でリリースする。",
    },
    category: "ci",
    sourceRepo: "https://github.com/xingkaixin/skills",
    sourceKind: "self",
    firstAdded: "2026-01-01",
    lastModified: "2026-08-20",
    contentLanguage: "en",
  },
  {
    slug: "review-code",
    name: "review-code",
    description: "Review a pull request and report correctness risks.",
    displayDescription: {
      en: "Review code changes.",
      zh: "审查代码改动。",
      ja: "コード変更をレビューする。",
    },
    category: "workflow",
    sourceRepo: "https://github.com/xingkaixin/skills",
    sourceKind: "self",
    firstAdded: "2026-01-02",
    lastModified: "2026-08-21",
    contentLanguage: "zh-CN",
  },
];

test("matches every normalized search term", () => {
  assert.equal(matchesSkillQuery("Release bilingual notes", " bilingual   release "), true);
  assert.equal(matchesSkillQuery("Release bilingual notes", "release review"), false);
});

test("searches agent trigger descriptions and returns localized results", () => {
  const result = searchSkills(skills, {
    query: "correctness risks",
    locale: "zh",
  });

  assert.equal(result.total, 1);
  assert.deepEqual(result.skills[0], {
    slug: "review-code",
    name: "review-code",
    category: "workflow",
    summary: "审查代码改动。",
    triggerDescription: "Review a pull request and report correctness risks.",
    lastModified: "2026-08-21",
    url: "https://skills.xingkaixin.me/zh/skills/review-code",
  });
});

test("filters, sorts, and limits catalog searches", () => {
  const result = searchSkills(skills, {
    category: "ci",
    sort: "az",
    limit: 1,
    locale: "en",
  });

  assert.equal(result.total, 1);
  assert.equal(result.skills[0]?.slug, "release-helper");
  assert.throws(
    () => searchSkills(skills, { category: "missing", locale: "en" }),
    /unknown category/,
  );
  assert.throws(
    () => searchSkills(skills, { limit: 21, locale: "en" }),
    /limit must be an integer/,
  );
});

test("returns exact skill details", () => {
  const result = getSkillDetails(skills, "release-helper", "ja");

  assert.equal(result.summary, "二言語でリリースする。");
  assert.equal(result.url, "https://skills.xingkaixin.me/ja/skills/release-helper");
  assert.throws(() => getSkillDetails(skills, "missing", "en"), /unknown skill/);
});

test("builds commands only for known install targets", () => {
  assert.equal(getInstallCommand(skills, "all"), "npx skills add xingkaixin/skills");
  assert.equal(
    getInstallCommand(skills, "skill", "review-code"),
    "npx skills add xingkaixin/skills --skill review-code",
  );
  assert.throws(() => getInstallCommand(skills, "skill"), /slug is required/);
  assert.throws(
    () => getInstallCommand(skills, "skill", "missing"),
    /unknown skill/,
  );
});
