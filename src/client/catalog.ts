import { projects } from "../data/projects";
import { copy } from "../i18n";
import { filterProjects, sortProjects } from "../lib/catalog";
import { readCatalogState, writeCatalogSearch, type CatalogState } from "../lib/catalog-state";
import { registerPageEnhancement } from "./lifecycle";

export interface CatalogResultsDetail {
  visibleIds: string[];
  apply: () => void;
}

registerPageEnhancement("catalog", context => {
  const root = document.querySelector<HTMLElement>("[data-catalog]");
  if (!root || context.page !== "project") return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const locale = context.locale, t = copy[locale];
  const query = root.querySelector<HTMLInputElement>("[data-catalog-query]")!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-catalog-category]")];
  const reset = root.querySelector<HTMLButtonElement>("[data-catalog-reset]")!;
  const empty = root.querySelector<HTMLElement>("[data-catalog-empty]")!;
  const emptyText = root.querySelector<HTMLElement>("[data-catalog-empty-text]")!;
  const count = root.querySelector<HTMLElement>("[data-catalog-count]")!;
  const announcement = root.querySelector<HTMLElement>("[data-catalog-announcement]")!;
  const cards = [...root.querySelectorAll<HTMLElement>("[data-catalog-card]")];
  const records = sortProjects(projects);
  let state = readCatalogState(location.search), timer = 0;
  const apply = (syncUrl = true, animate = true) => {
    const visibleIds = filterProjects(records, state.query, state.category, locale).map(record => record.id);
    const update = () => {
      for (const card of cards) {
        const hidden = !visibleIds.includes(card.dataset.projectId!);
        if (hidden && card.contains(document.activeElement)) query.focus({ preventScroll: true });
        card.hidden = hidden;
      }
      count.textContent = `${visibleIds.length} ${t.catalog.count}`;
      empty.hidden = visibleIds.length > 0;
      emptyText.textContent = state.query.trim() ? t.catalog.empty : t.catalog.emptyCategory;
      reset.hidden = state.category === "all" && !state.query;
      for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.catalogCategory === state.category));
    };
    const event = new CustomEvent<CatalogResultsDetail>("faza:catalog-results", { cancelable: true, detail: { visibleIds, apply: update } });
    if (!animate || root.dispatchEvent(event)) update();
    clearTimeout(timer);
    timer = window.setTimeout(() => { announcement.textContent = count.textContent; }, 250);
    if (syncUrl) {
      const url = new URL(location.href);
      url.searchParams.delete("q");
      url.searchParams.delete("category");
      for (const [key, value] of new URLSearchParams(writeCatalogSearch(state))) url.searchParams.set(key, value);
      history.replaceState({ ...history.state }, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };
  query.value = state.query;
  apply(true, false);
  root.querySelector<HTMLElement>("[data-catalog-controls]")!.hidden = false;
  query.addEventListener("input", () => { state.query = query.value; apply(); }, { signal });
  for (const button of buttons) button.addEventListener("click", () => {
    state.category = button.dataset.catalogCategory as CatalogState["category"];
    apply();
  }, { signal });
  reset.addEventListener("click", () => {
    state = { query: "", category: "all" };
    query.value = "";
    query.focus({ preventScroll: true });
    apply();
  }, { signal });
  window.addEventListener("popstate", () => {
    if (location.pathname !== context.pathname) return;
    state = readCatalogState(location.search);
    query.value = state.query;
    apply(false, false);
  }, { signal });
  for (const image of root.querySelectorAll<HTMLImageElement>(".catalog-media img")) {
    const failed = () => { image.parentElement!.querySelector<HTMLElement>(".catalog-media-error")!.hidden = false; };
    image.addEventListener("error", failed, { signal });
    if (image.complete && !image.naturalWidth) failed();
  }
  return () => { controller.abort(); clearTimeout(timer); };
});
