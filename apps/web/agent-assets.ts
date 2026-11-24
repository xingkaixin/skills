import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { SITE_NAME, SITE_REPO, SITE_URL } from "./src/data/catalog.ts";
import { skillsData } from "./src/data/skills.generated.ts";
import { LOCALES, localeHref } from "./src/i18n/config.ts";
import { ui } from "./src/i18n/ui.ts";
import { getInstallCommand } from "./src/data/skill-catalog.ts";
import { parseSkillMarkdown } from "../../scripts/catalog/markdown.ts";

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (entity) =>
      entity === "&amp;" ? "&" : entity === "&lt;" ? "<" : entity === "&gt;" ? ">" : entity === "&quot;" ? '"' : "'",
    );
}

function visibleCodepoints(html: string): Set<number> {
  const withoutScripts = html.replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, "");
  const attrs = Array.from(
    withoutScripts.matchAll(/(?:placeholder|data-copy-\w+|data-count-\w+|data-local-only|data-empty)="([^"]*)"/gi),
    (match) => match[1],
  ).join(" ");
  const text = decodeEntities(withoutScripts.replace(/<[^>]+>/g, "") + " " + attrs);
  const codepoints = new Set<number>();
  for (const ch of text) {
    codepoints.add(ch.codePointAt(0)!);
  }
  return codepoints;
}

function rangeIntersects(unicodeRange: string, codepoints: Set<number>): boolean {
  for (const part of unicodeRange.split(",")) {
    const match = part.trim().match(/^U\+([0-9a-f]+)(?:-([0-9a-f]+))?$/i);
    if (!match) return true;
    const start = Number.parseInt(match[1], 16);
    const end = match[2] ? Number.parseInt(match[2], 16) : start;
    for (const cp of codepoints) {
      if (cp >= start && cp <= end) return true;
    }
  }
  return false;
}

async function pruneUnusedFontFaces(dir: URL): Promise<void> {
  const rootPath = fileURLToPath(dir);
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const full = `${current}/${entry.name}`;
        if (entry.isDirectory()) {
          await walk(full);
          return;
        }
        if (!entry.name.endsWith(".html")) return;
        const html = await readFile(full, "utf8");
        const codepoints = visibleCodepoints(html);
        const pruned = html.replace(/<style>([\s\S]*?)<\/style>/g, (styleBlock, css: string) => {
          if (!css.includes("@font-face")) return styleBlock;
          const nextCss = css.replace(/@font-face\{[^}]*\}/g, (rule) => {
            if (rule.includes("xiaolai-core")) return rule;
            const range = rule.match(/unicode-range:([^;}]+)/)?.[1];
            if (!range) return rule;
            return rangeIntersects(range, codepoints) ? rule : "";
          });
          return `<style>${nextCss}</style>`;
        });
        if (pruned !== html) {
          await writeFile(full, pruned);
        }
      }),
    );
  }
  await walk(rootPath);
}

export default function agentAssets(): AstroIntegration {
  return {
    name: "agent-assets",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const write = async (path: string, content: string) => {
          const target = new URL(`.${path}`, dir);
          await mkdir(new URL(".", target), { recursive: true });
          await writeFile(target, content);
        };
        const json = (path: string, value: unknown) => write(path, `${JSON.stringify(value, null, 2)}\n`);
        for (const locale of LOCALES) {
          const strings = ui[locale];
          const home = localeHref(locale);
          await write(`/markdown${home === "/" ? "/index" : home}.md`, [
            `# ${strings.home.heading}`,
            strings.home.intro,
            `\`\`\`sh\n${getInstallCommand(skillsData, "all")}\n\`\`\``,
            ...skillsData.map((skill) => `## [${skill.slug}](${SITE_URL}${localeHref(locale, `/skills/${skill.slug}`)})\n\n${skill.displayDescription[locale]}\n\n${skill.category}`),
            `## ${strings.home.faqHeading}`,
            ...strings.faq.map((item) => `### ${item.question}\n\n${item.answer}`),
          ].join("\n\n") + "\n");
          for (const skill of skillsData) {
            const sourcePath = `skills/${skill.category}/${skill.slug}/SKILL.md`;
            const source = await readFile(fileURLToPath(new URL(`../../${sourcePath}`, import.meta.url)), "utf8");
            const { body } = parseSkillMarkdown(source, skill.slug);
            await write(`/markdown${localeHref(locale, `/skills/${skill.slug}`)}.md`, [
              `# ${skill.slug}`,
              skill.displayDescription[locale],
              `\`\`\`sh\n${getInstallCommand(skillsData, "skill", skill.slug)}\n\`\`\``,
              `${strings.skill.repository}: ${skill.sourceRepo}`,
              `${strings.skill.added}: ${skill.firstAdded}\n\n${strings.skill.updated}: ${skill.lastModified}`,
              `Source: ${SITE_REPO}/blob/main/${sourcePath}\n\nRelative references in the following skill body resolve against its source directory.`,
              body,
            ].join("\n\n") + "\n");
          }
        }
        await json("/.well-known/api-catalog", {
          linkset: [{
            anchor: `${SITE_URL}/.well-known/api-catalog`,
            item: [{ href: `${SITE_URL}/api/skills.json` }],
          }, {
            anchor: `${SITE_URL}/api/skills.json`,
            "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/json" }],
            "service-doc": [{ href: `${SITE_URL}/api-docs.md`, type: "text/markdown" }],
          }],
        });
        await json("/openapi.json", {
          openapi: "3.1.0",
          info: { title: `${SITE_NAME} catalog API`, version: "1.0.0", description: "Read-only, build-time snapshot of the public skill catalog. No authentication required." },
          servers: [{ url: SITE_URL }],
          paths: { "/api/skills.json": { get: {
            operationId: "listSkills",
            summary: "List all published skills with multilingual descriptions",
            responses: { "200": { description: "Complete catalog; filter locally by slug or category.", content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Skill" } } },
            } } },
          } } },
          components: { schemas: { Skill: {
            type: "object",
            required: ["slug", "name", "description", "displayDescription", "category", "sourceRepo", "sourceKind", "firstAdded", "lastModified", "contentLanguage"],
            properties: {
              ...Object.fromEntries(["slug", "name", "description", "category"].map((key) => [key, { type: "string" }])),
              displayDescription: { type: "object", required: [...LOCALES], properties: Object.fromEntries(LOCALES.map((locale) => [locale, { type: "string" }])) },
              sourceRepo: { type: "string", format: "uri" },
              sourceKind: { type: "string", enum: ["self", "upstream", "adapted"] },
              firstAdded: { type: "string", format: "date" },
              lastModified: { type: "string", format: "date" },
              contentLanguage: { type: "string", enum: ["en", "zh-CN"] },
            },
          } } },
        });
        await pruneUnusedFontFaces(dir);
      },
    },
  };
}
