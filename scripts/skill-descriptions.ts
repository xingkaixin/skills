import { promises as fs } from "node:fs";
import path from "node:path";
import {
  DESCRIPTIONS_PATH,
  findOutdatedDescriptions,
  hashSkillSource,
  LOCALES,
  loadSkillDescriptions,
  type SkillDescription,
} from "./catalog/descriptions.ts";
import { parseSkillMarkdown } from "./catalog/markdown.ts";

interface SkillSource {
  slug: string;
  category: string;
  sourceHash: string;
  markdownPath: string;
}

const repoRoot = process.cwd();
const touchIndex = process.argv.indexOf("--touch");
const sources = await readSkillSources(repoRoot);
const descriptions = await loadSkillDescriptions(repoRoot);

if (touchIndex !== -1) {
  await touch(process.argv[touchIndex + 1]);
} else {
  reportStatus();
}

function reportStatus(): void {
  const outdated = findOutdatedDescriptions(sources, descriptions);
  if (outdated.length === 0) {
    console.log(`All ${sources.length} skills have current display descriptions.`);
    return;
  }

  const bySlug = new Map(sources.map((source) => [source.slug, source]));
  console.log(`${outdated.length} of ${sources.length} skills need work:\n`);
  for (const request of outdated) {
    const source = bySlug.get(request.slug)!;
    console.log(
      [
        `slug:       ${request.slug}`,
        `reason:     ${request.reason}`,
        `sourceHash: ${request.sourceHash}`,
        `markdown:   ${source.markdownPath}`,
        "",
      ].join("\n"),
    );
  }
  console.log(`Write entries into ${DESCRIPTIONS_PATH}, then run pnpm generate:web-data.`);
}

// Escape hatch for edits that do not change what the skill does: keep the
// reviewed text and re-stamp the hash instead of rewriting three locales.
async function touch(slug: string | undefined): Promise<void> {
  const source = sources.find((candidate) => candidate.slug === slug);
  if (!source) {
    throw new Error(`Unknown skill slug: ${slug ?? "(none given)"}`);
  }
  const entry = descriptions[source.slug];
  if (!entry || LOCALES.some((locale) => !entry[locale]?.trim())) {
    throw new Error(`"${source.slug}" has no complete description to keep.`);
  }

  descriptions[source.slug] = { ...entry, sourceHash: source.sourceHash };
  await writeDescriptions(descriptions);
  console.log(`Re-stamped ${source.slug} at ${source.sourceHash}.`);
}

async function writeDescriptions(
  value: Record<string, SkillDescription>,
): Promise<void> {
  const sorted = Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
  await fs.writeFile(
    path.join(repoRoot, DESCRIPTIONS_PATH),
    `${JSON.stringify(sorted, null, 2)}\n`,
    "utf8",
  );
}

async function readSkillSources(root: string): Promise<SkillSource[]> {
  const skillsRoot = path.join(root, "skills");
  const categories = await fs.readdir(skillsRoot, { withFileTypes: true });
  const nested = await Promise.all(
    categories
      .filter((entry) => entry.isDirectory())
      .map(async (category) => {
        const slugs = await fs.readdir(path.join(skillsRoot, category.name), {
          withFileTypes: true,
        });
        return Promise.all(
          slugs
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
              const markdownPath = path.posix.join(
                "skills",
                category.name,
                entry.name,
                "SKILL.md",
              );
              const markdown = await fs.readFile(
                path.join(root, markdownPath),
                "utf8",
              );
              const parsed = parseSkillMarkdown(markdown, entry.name);
              return {
                slug: entry.name,
                category: category.name,
                sourceHash: hashSkillSource(parsed.description, parsed.body),
                markdownPath,
              };
            }),
        );
      }),
  );
  return nested.flat().sort((left, right) => left.slug.localeCompare(right.slug));
}
