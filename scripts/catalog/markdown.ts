import path from "node:path";
import GitHubSlugger from "github-slugger";
import matter from "gray-matter";
import { marked, Renderer, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { SITE_REPO } from "./config.ts";

export interface ParsedSkill {
  name: string;
  description: string;
  body: string;
  contentLanguage: "en" | "zh-CN";
}

export function parseSkillMarkdown(markdown: string, slug: string): ParsedSkill {
  const parsed = matter(markdown);
  const name = readRequiredString(parsed.data.name, "name", slug);
  const description = readRequiredString(
    parsed.data.description,
    "description",
    slug,
  );

  return {
    name,
    description,
    body: parsed.content.trim(),
    contentLanguage: detectLanguage(parsed.content),
  };
}

export function renderSkillBody(
  body: string,
  category: string,
  slug: string,
): string {
  const renderer = createRenderer(category, slug);
  const html = marked.parse(body, {
    async: false,
    gfm: true,
    renderer,
  });

  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "details",
      "summary",
      "kbd",
      "mark",
      "img",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "title"],
      code: ["class"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs: rewriteAttribute(attributes, "href", category, slug, false),
      }),
      img: (tagName, attributes) => ({
        tagName,
        attribs: rewriteAttribute(attributes, "src", category, slug, true),
      }),
    },
  });
}

function createRenderer(category: string, slug: string): Renderer {
  const renderer = new Renderer();
  const slugger = new GitHubSlugger();
  const renderLink = renderer.link.bind(renderer);
  const renderImage = renderer.image.bind(renderer);

  renderer.heading = function heading({ tokens, depth, text }: Tokens.Heading) {
    const level = Math.min(depth + 1, 6);
    const id = slugger.slug(text);
    return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>\n`;
  };
  renderer.link = function link(token: Tokens.Link) {
    return renderLink({
      ...token,
      href: rewriteLocalUrl(token.href, category, slug, false),
    });
  };
  renderer.image = function image(token: Tokens.Image) {
    return renderImage({
      ...token,
      href: rewriteLocalUrl(token.href, category, slug, true),
    });
  };
  renderer.checkbox = () => "";

  return renderer;
}

function rewriteAttribute(
  attributes: Record<string, string>,
  attribute: "href" | "src",
  category: string,
  slug: string,
  raw: boolean,
): Record<string, string> {
  const value = attributes[attribute];
  if (!value) {
    return attributes;
  }

  return {
    ...attributes,
    [attribute]: rewriteLocalUrl(value, category, slug, raw),
  };
}

function rewriteLocalUrl(
  value: string,
  category: string,
  slug: string,
  raw: boolean,
): string {
  if (
    value.startsWith("#") ||
    value.startsWith("/") ||
    value.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return value;
  }

  const suffixIndex = value.search(/[?#]/);
  const relativePath =
    suffixIndex === -1 ? value : value.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : value.slice(suffixIndex);
  const skillRoot = path.posix.join("skills", category, slug);
  const target = path.posix.normalize(path.posix.join(skillRoot, relativePath));
  if (target !== skillRoot && !target.startsWith(`${skillRoot}/`)) {
    return "#";
  }

  if (raw) {
    return `https://raw.githubusercontent.com/xingkaixin/skills/main/${target}${suffix}`;
  }

  const view = relativePath.endsWith("/") ? "tree" : "blob";
  return `${SITE_REPO}/${view}/main/${target}${suffix}`;
}

function readRequiredString(value: unknown, field: string, slug: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Skill "${slug}" requires a non-empty ${field} field.`);
  }
  return value.trim();
}

function detectLanguage(content: string): "en" | "zh-CN" {
  const cjkCount = content.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latinCount = content.match(/[A-Za-z]/g)?.length ?? 0;
  return cjkCount >= 20 && cjkCount / Math.max(cjkCount + latinCount, 1) >= 0.2
    ? "zh-CN"
    : "en";
}
