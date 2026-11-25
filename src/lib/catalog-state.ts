import type { Category, Locale } from "../data/types.ts";

export interface CatalogState {
  query: string;
  category: Category | "all";
}
const categories = new Set(["all", "web", "app", "hardware", "hybrid", "tools"]);

export function readCatalogState(search: string): CatalogState {
  const params = new URLSearchParams(search);
  const category = params.get("category") ?? "all";
  return { query: params.get("q") ?? "", category: categories.has(category) ? category as CatalogState["category"] : "all" };
}

export function writeCatalogSearch(state: CatalogState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category !== "all" && categories.has(state.category)) params.set("category", state.category);
  const search = params.toString();
  return search ? `?${search}` : "";
}

export interface CatalogVisit {
  version: 1;
  key: string;
  locale: Locale;
  url: string;
  scrollY: number;
  focusedProjectId: string | null;
  detailPath: string | null;
}

export function readCatalogVisit(value: unknown, locale: Locale, origin: string): CatalogVisit | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (item.version !== 1 || item.locale !== locale || typeof item.key !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(item.key) || typeof item.url !== "string" ||
    typeof item.scrollY !== "number" || !Number.isFinite(item.scrollY) || item.scrollY < 0 ||
    !(item.focusedProjectId === null || (typeof item.focusedProjectId === "string" && /^[a-z0-9-]+$/.test(item.focusedProjectId))) ||
    !(item.detailPath === null || (typeof item.detailPath === "string" && new RegExp(`^/${locale}/project/[a-z0-9]+(?:-[a-z0-9]+)*/$`).test(item.detailPath)))) return null;
  try {
    const url = new URL(item.url, origin);
    if (url.origin !== origin || url.pathname !== `/${locale}/project/` || url.hash) return null;
    return { version: 1, key: item.key, locale, url: `${url.pathname}${url.search}`,
      scrollY: item.scrollY, focusedProjectId: item.focusedProjectId, detailPath: item.detailPath } as CatalogVisit;
  } catch {
    return null;
  }
}
