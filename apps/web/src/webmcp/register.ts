import {
  CATALOG_SEARCH_EVENT,
  getInstallCommand,
  getSkillDetails,
  MAX_SKILL_SEARCH_RESULTS,
  searchSkills,
  type InstallScope,
  type SkillSort,
} from "@/data/skill-catalog";
import { skillCategories, skillsData } from "@/data/skills.generated";
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeTags,
  type Locale,
} from "@/i18n/config";

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(input: unknown): unknown;
  annotations: { readOnlyHint: true };
}

interface ModelContext {
  registerTool(tool: WebMcpTool, options: { signal: AbortSignal }): Promise<void>;
}

export function registerWebMcpTools(): void {
  const modelContext = (
    document as Document & { modelContext?: ModelContext }
  ).modelContext;
  if (!modelContext) return;

  const controller = new AbortController();
  window.addEventListener("pagehide", () => controller.abort(), { once: true });

  void Promise.all(
    catalogTools().map((tool) =>
      modelContext.registerTool(tool, { signal: controller.signal }),
    ),
  ).catch((error: unknown) => {
    console.error("Unable to register WebMCP catalog tools.", error);
  });
}

function catalogTools(): WebMcpTool[] {
  const localeSchema = {
    type: "string",
    enum: [...LOCALES],
    description: "Language used for localized summaries and URLs. Defaults to the page language.",
  };
  const slugSchema = {
    type: "string",
    enum: skillsData.map((skill) => skill.slug),
    description: "Exact skill slug from the catalog.",
  };

  return [
    {
      name: "search_skills",
      description:
        "Search the skill catalog by user intent, category, and sort order. Returns concise matches and synchronizes the visible catalog when it is present on the page.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: {
            type: "string",
            maxLength: 200,
            description:
              "Optional words describing the task. Every word must occur in the skill slug, category, trigger description, or localized summary.",
          },
          category: {
            type: "string",
            enum: ["all", ...skillCategories],
            default: "all",
            description: "Optional catalog category filter.",
          },
          sort: {
            type: "string",
            enum: ["recent", "az"],
            default: "recent",
            description: "Sort by most recently updated or alphabetically by slug.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: MAX_SKILL_SEARCH_RESULTS,
            default: 10,
            description: "Maximum number of matches to return.",
          },
          locale: localeSchema,
        },
      },
      execute(input) {
        const values = inputRecord(input, [
          "query",
          "category",
          "sort",
          "limit",
          "locale",
        ]);
        const result = searchSkills(skillsData, {
          query: optionalString(values, "query"),
          category: optionalString(values, "category"),
          sort: optionalSort(values, "sort"),
          limit: optionalInteger(values, "limit"),
          locale: optionalLocale(values) ?? currentLocale(),
        });
        const catalogVisible = document.querySelector("[data-catalog]") !== null;
        if (catalogVisible) {
          document.dispatchEvent(
            new CustomEvent(CATALOG_SEARCH_EVENT, {
              detail: {
                query: result.query,
                category: result.category,
                sort: result.sort,
              },
            }),
          );
        }
        return { ...result, catalogVisible };
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "get_skill",
      description:
        "Get exact metadata for one catalog skill, including its agent trigger description, localized summary, provenance, dates, and detail URL.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: slugSchema,
          locale: localeSchema,
        },
        required: ["slug"],
      },
      execute(input) {
        const values = inputRecord(input, ["slug", "locale"]);
        return getSkillDetails(
          skillsData,
          requiredString(values, "slug"),
          optionalLocale(values) ?? currentLocale(),
        );
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "get_install_command",
      description:
        "Return the validated terminal command for installing the whole catalog or one exact skill. This does not run the command or modify the user's system.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          scope: {
            type: "string",
            enum: ["all", "skill"],
            description: "Whether to install the complete catalog or one skill.",
          },
          slug: slugSchema,
        },
        required: ["scope"],
      },
      execute(input) {
        const values = inputRecord(input, ["scope", "slug"]);
        const scope = requiredInstallScope(values, "scope");
        const slug = optionalString(values, "slug");
        return {
          scope,
          ...(slug === undefined ? {} : { slug }),
          command: getInstallCommand(skillsData, scope, slug),
        };
      },
      annotations: { readOnlyHint: true },
    },
  ];
}

function inputRecord(
  input: unknown,
  allowedKeys: string[],
): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError("tool input must be an object");
  }
  const record = input as Record<string, unknown>;
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(record).find((key) => !allowed.has(key));
  if (unknownKey) {
    throw new TypeError(`unknown input property: ${unknownKey}`);
  }
  return record;
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = optionalString(input, key);
  if (value === undefined || value.length === 0) {
    throw new TypeError(`${key} is required`);
  }
  return value;
}

function optionalString(
  input: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new TypeError(`${key} must be a string`);
  }
  return value;
}

function optionalInteger(
  input: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Number.isInteger(value)) {
    throw new TypeError(`${key} must be an integer`);
  }
  return value as number;
}

function optionalSort(
  input: Record<string, unknown>,
  key: string,
): SkillSort | undefined {
  const value = optionalString(input, key);
  if (value === undefined) return undefined;
  if (value !== "recent" && value !== "az") {
    throw new RangeError(`${key} must be recent or az`);
  }
  return value;
}

function requiredInstallScope(
  input: Record<string, unknown>,
  key: string,
): InstallScope {
  const value = requiredString(input, key);
  if (value !== "all" && value !== "skill") {
    throw new RangeError(`${key} must be all or skill`);
  }
  return value;
}

function optionalLocale(input: Record<string, unknown>): Locale | undefined {
  const value = optionalString(input, "locale");
  if (value === undefined) return undefined;
  if (!LOCALES.includes(value as Locale)) {
    throw new RangeError(`unknown locale: ${value}`);
  }
  return value as Locale;
}

function currentLocale(): Locale {
  return (
    LOCALES.find((locale) => localeTags[locale] === document.documentElement.lang) ??
    DEFAULT_LOCALE
  );
}
