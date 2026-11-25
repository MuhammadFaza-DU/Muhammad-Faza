import type { Category, Locale, ProjectRecord } from "../data/types.ts";

export function filterProjects(
  records: readonly ProjectRecord[],
  query: string,
  category: Category | "all",
  locale: Locale,
): ProjectRecord[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  return records.filter((record) => {
    if (category !== "all" && record.category !== category) return false;
    const { title, summary } = record.content[locale];
    return `${title} ${summary} ${record.tags.join(" ")}`.toLocaleLowerCase(locale).includes(needle);
  });
}

export function sortProjects(records: readonly ProjectRecord[]): ProjectRecord[] {
  return [...records].sort((a, b) => {
    const dateA = a.firstPublished ? Date.parse(a.firstPublished.date) : NaN;
    const dateB = b.firstPublished ? Date.parse(b.firstPublished.date) : NaN;
    if (!Number.isFinite(dateA)) return Number.isFinite(dateB) ? 1 : 0;
    if (!Number.isFinite(dateB)) return -1;
    return dateB - dateA;
  });
}
