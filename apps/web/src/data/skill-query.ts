export const CATALOG_SEARCH_EVENT = "skills:catalog-search";

export type SkillSort = "recent" | "az";

export interface CatalogSearchState {
  query: string;
  category: string;
  sort: SkillSort;
}

export function matchesSkillQuery(haystack: string, query: string): boolean {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const normalizedHaystack = haystack.toLocaleLowerCase();
  return terms.every((term) => normalizedHaystack.includes(term));
}
