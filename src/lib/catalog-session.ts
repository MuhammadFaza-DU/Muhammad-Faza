import { readCatalogVisit, type CatalogVisit } from "./catalog-state.ts";

export type CatalogStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createCatalogSession(storage: CatalogStorage | null, origin: string) {
  const memory = new Map<string, CatalogVisit>();
  return {
    saveCatalogVisit(visit: CatalogVisit): void {
      const safe = readCatalogVisit(visit, visit.locale, origin);
      if (!safe) return;
      memory.set(visit.key, safe);
      try { storage?.setItem(`faza-catalog:${visit.key}`, JSON.stringify(safe)); } catch { /* Same-document memory remains usable. */ }
    },
    catalogReturnForDetail(pathname: string, historyState: unknown): CatalogVisit | null {
      if (!historyState || typeof historyState !== "object") return null;
      const key = (historyState as Record<string, unknown>).fazaCatalogReturn;
      if (typeof key !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(key)) return null;
      const locale = pathname.startsWith("/id/") ? "id" : pathname.startsWith("/en/") ? "en" : null;
      if (!locale) return null;
      let value: unknown = memory.get(key);
      if (!value) {
        try { value = JSON.parse(storage?.getItem(`faza-catalog:${key}`) ?? "null"); } catch { return null; }
      }
      const visit = readCatalogVisit(value, locale, origin);
      return visit?.key === key && visit.detailPath === pathname ? visit : null;
    },
  };
}
