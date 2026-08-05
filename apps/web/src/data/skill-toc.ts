export interface TocEntry {
  id: string;
  label: string;
  /** 0 for <h2>, 1 for <h3>; deeper headings are left out of the rail. */
  depth: number;
}

const HEADING_PATTERN = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, " ")
    .trim();
}

export function extractToc(html: string | undefined): TocEntry[] {
  if (!html) return [];

  return [...html.matchAll(HEADING_PATTERN)].map(([, level, id, inner]) => ({
    id,
    label: toPlainText(inner),
    depth: Number(level) - 2,
  }));
}
