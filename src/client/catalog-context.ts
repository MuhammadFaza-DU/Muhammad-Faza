import { navigate } from "astro:transitions/client";
import { readCatalogVisit, type CatalogVisit } from "../lib/catalog-state";
import { createCatalogSession } from "../lib/catalog-session";
import { registerPageEnhancement } from "./lifecycle";

let storage: Storage | null = null;
try { storage = window.sessionStorage; } catch { /* Navigation keeps a native fallback. */ }
const session = createCatalogSession(storage, location.origin);
let pending: { visit: CatalogVisit; index: number; signal: AbortSignal } | null = null;

document.addEventListener("astro:before-preparation", event => {
  pending = null;
  if (event.navigationType !== "push" || event.from.origin !== location.origin ||
    !/^\/(id|en)\/project\/$/.test(event.from.pathname)) return;
  const card = event.sourceElement?.closest<HTMLElement>("[data-catalog-card]");
  if (!card || !new RegExp(`^/${document.documentElement.lang}/project/[a-z0-9-]+/$`).test(event.to.pathname)) return;
  const locale = document.documentElement.lang === "id" ? "id" : "en";
  const visit: CatalogVisit = {
    version: 1, key: crypto.randomUUID(), locale,
    url: `${location.pathname}${location.search}`, scrollY: window.scrollY,
    focusedProjectId: card.dataset.projectId ?? null, detailPath: event.to.pathname,
  };
  session.saveCatalogVisit(visit);
  history.replaceState({ ...history.state, fazaCatalogVisit: visit }, "");
  pending = { visit, index: history.state.index, signal: event.signal };
});
document.addEventListener("astro:after-swap", () => {
  if (pending && !pending.signal.aborted && location.pathname === pending.visit.detailPath) {
    history.replaceState({ ...history.state, fazaCatalogReturn: pending.visit.key, fazaCatalogParentIndex: pending.index }, "");
  }
  pending = null;
});

registerPageEnhancement("catalog-context", context => {
  const controller = new AbortController();
  let frame = 0;
  if (context.page === "project") {
    const visit = readCatalogVisit(history.state?.fazaCatalogVisit, context.locale, location.origin);
    if (visit && visit.url === `${location.pathname}${location.search}`) {
      const restoration = new AbortController();
      const cancelRestoration = () => { restoration.abort(); cancelAnimationFrame(frame); };
      controller.signal.addEventListener("abort", cancelRestoration, { once: true });
      for (const type of ["pointerdown", "keydown", "input", "wheel", "touchstart", "astro:before-preparation"]) {
        document.addEventListener(type, cancelRestoration, { capture: true, passive: true, signal: restoration.signal });
      }
      document.addEventListener("focusin", event => {
        if (event.target instanceof HTMLElement &&
          event.target.matches("a[href],button,input,select,textarea,summary,[contenteditable=true],[tabindex]:not(main)")) cancelRestoration();
      }, { capture: true, signal: restoration.signal });
      void document.fonts.ready.then(() => {
        if (restoration.signal.aborted) return;
        frame = requestAnimationFrame(() => {
          if (restoration.signal.aborted) return;
          restoration.abort();
          if (visit.focusedProjectId) document.querySelector<HTMLElement>(`[data-project-id="${visit.focusedProjectId}"]:not([hidden]) a`)?.focus({ preventScroll: true });
          window.scrollTo({ top: visit.scrollY, behavior: "instant" });
        });
      });
    }
  } else if (context.page === "detail") {
    const visit = session.catalogReturnForDetail(location.pathname, history.state);
    const back = document.querySelector<HTMLAnchorElement>("[data-catalog-back]");
    if (visit && back) {
      back.href = visit.url;
      back.addEventListener("click", event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
        event.preventDefault();
        const parent = history.state?.fazaCatalogParentIndex;
        if (typeof parent === "number" && history.state.index === parent + 1) history.back();
        else void navigate(visit.url, { history: "replace", state: { fazaCatalogVisit: visit } });
      }, { signal: controller.signal });
    }
  }
  return () => { controller.abort(); cancelAnimationFrame(frame); };
});
