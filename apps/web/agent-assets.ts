import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { SITE_NAME, SITE_REPO, SITE_URL } from "./src/data/catalog.ts";
import { skillsData } from "./src/data/skills.generated.ts";
import { LOCALES, localeHref } from "./src/i18n/config.ts";
import { ui } from "./src/i18n/ui.ts";
import { getInstallCommand } from "./src/data/skill-catalog.ts";
import { parseSkillMarkdown } from "../../scripts/catalog/markdown.ts";

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
            strings.home.intro(skillsData.length),
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
        await json("/api/skills.json", skillsData);
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
        await json("/_routes.json", {
          version: 1,
          include: ["/", "/skills/*", ...LOCALES.filter((locale) => localeHref(locale) !== "/").flatMap((locale) => [`/${locale}`, `/${locale}/*`]), "/.well-known/api-catalog"],
          exclude: [],
        });
      },
    },
  };
}
