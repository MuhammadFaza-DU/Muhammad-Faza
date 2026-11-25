import { resolveEntryLocale, localizedPath } from "../lib/locale";
import { registerPageEnhancement } from "./lifecycle";
registerPageEnhancement("entry", () => {
const entry = document.querySelector<HTMLElement>("[data-entry-target]");
if (entry) {
  let saved: unknown;
  try { saved = localStorage.getItem("faza-locale"); } catch { /* English fallback is rendered already. */ }
  const locale = resolveEntryLocale(saved, navigator.languages);
  const target = entry.dataset.entryTarget;
  const destination = target === "project" ? localizedPath(locale, "project")
    : target === "contact" ? localizedPath(locale, "contact")
    : `${localizedPath(locale, "home")}${target === "skill" ? "#skills" : ""}`;
  const next = new URL(destination, location.origin);
  next.search = location.search;
  if (!next.hash) next.hash = location.hash;
  if (next.pathname !== location.pathname || next.hash !== location.hash) location.replace(next.href);
}
return () => {};
});
