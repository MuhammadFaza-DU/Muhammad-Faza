import { createEnhancementRegistry, type Enhancement } from "../lib/lifecycle";
import { readPageContext } from "../lib/locale";

const registry = createEnhancementRegistry();
const activate = () => registry.activate(readPageContext(window.location.pathname) ?? {
  locale: document.documentElement.lang === "id" ? "id" : "en",
  page: "home",
  pathname: window.location.pathname,
});
document.addEventListener("astro:before-swap", () => registry.dispose());
document.addEventListener("astro:page-load", activate);
window.addEventListener("pagehide",event => { if (!event.persisted) registry.dispose(); });
window.addEventListener("pageshow",event => { if (event.persisted) activate(); });
if (document.readyState !== "loading") activate();
else document.addEventListener("DOMContentLoaded", activate, {once:true});

export function registerPageEnhancement(key: string, mount: Enhancement): () => void {
  return registry.register(key,mount);
}
