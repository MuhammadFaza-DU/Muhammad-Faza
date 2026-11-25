import type { Locale, PageContext, PageKind } from "../data/types.ts";
import { projects } from "../data/projects.ts";

export function resolveEntryLocale(saved: unknown, languages: readonly string[]): Locale {
  if (saved === "id" || saved === "en") return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "id" || base === "en") return base;
  }
  return "en";
}

export function localizedPath(
  locale: Locale,
  page: PageKind,
  slug?: string,
): string {
  if (page === "home") return `/${locale}/`;
  if (page === "project") return `/${locale}/project/`;
  if (page === "contact") return `/${locale}/contact/`;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("A valid project slug is required");
  }
  return `/${locale}/project/${slug}/`;
}

export function readPageContext(pathname: string): PageContext | null {
  const match = /^\/(id|en)(?:\/(project|contact)(?:\/([a-z0-9-]+))?)?\/?$/.exec(pathname);
  if (!match) return null;
  const locale = match[1] as Locale;
  const section = match[2];
  const slug = match[3];
  if (slug && (section !== "project" || !projects.some(project => project.slug === slug))) return null;
  return {locale, page: slug ? "detail" : section === "contact" ? "contact" : section === "project" ? "project" : "home", pathname, ...(slug ? {slug} : {})};
}

export function navIndex(page: PageKind): number {
  return page === "contact" ? 2 : page === "home" ? 0 : 1;
}
