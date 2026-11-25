import { resolveTheme } from "../lib/preferences";
import { registerPageEnhancement } from "./lifecycle";

let saved: unknown = null;
try { saved = localStorage.getItem("faza-theme"); } catch { /* Storage is optional. */ }
document.addEventListener("astro:before-swap", event => {
  event.newDocument.documentElement.dataset.theme = resolveTheme(saved);
});
registerPageEnhancement("preferences", () => {
  const controller = new AbortController();
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  const language = document.querySelector<HTMLDetailsElement>("[data-language-dropdown]");
  const languageTrigger=language?.querySelector<HTMLElement>("[data-language-toggle]");
  const closeLanguage=(restore=false)=>{
    if(language)language.open=false;
    if(restore)languageTrigger?.focus({preventScroll:true});
  };
  function apply() {
    const theme = resolveTheme(saved);
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0A0A0A" : "#FFFFFF");
    if (toggle) {
      toggle.setAttribute("aria-pressed",String(theme === "dark"));
      const text = toggle.querySelector<HTMLElement>("[data-theme-state]");
      if (text) text.textContent = theme === "dark" ? toggle.dataset.dark! : toggle.dataset.light!;
    }
  }
  if (toggle) {
    toggle.disabled = false;
    toggle.addEventListener("click",() => {
      saved = resolveTheme(saved) === "dark" ? "light" : "dark";
      try { localStorage.setItem("faza-theme",String(saved)); } catch { /* Session preference remains active. */ }
      apply();
    },{signal:controller.signal});
  }
  language?.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&language.open) {
      event.preventDefault();event.stopPropagation();closeLanguage(true);return;
    }
    const links=[...language.querySelectorAll<HTMLAnchorElement>("[data-locale]")];
    if(!links.length)return;
    const index=links.findIndex(link=>link===document.activeElement);
    let target:number|undefined;
    if(event.key==="ArrowDown"||event.key==="ArrowUp") {
      language.open=true;
      target=index<0?Math.max(0,links.findIndex(link=>link.hasAttribute("aria-current"))):
        (index+(event.key==="ArrowDown"?1:-1)+links.length)%links.length;
    } else if(language.open&&(event.key==="Home"||event.key==="End")) {
      target=event.key==="Home"?0:links.length-1;
    }
    if(target!==undefined){event.preventDefault();links[target].focus();}
  },{signal:controller.signal});
  document.addEventListener("pointerdown",event=>{
    if(event.target instanceof Node&&!language?.contains(event.target))closeLanguage();
  },{signal:controller.signal});
  document.addEventListener("focusin",event=>{
    if(event.target instanceof Node&&!language?.contains(event.target))closeLanguage();
  },{signal:controller.signal});
  for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-locale]")) {
    const syncTarget = () => {
      const target = new URL(link.href);
      target.search = window.location.search;
      target.hash = window.location.hash;
      link.href = target.href;
    };
    syncTarget();
    window.addEventListener("hashchange",syncTarget,{signal:controller.signal});
    link.addEventListener("click",() => {
      syncTarget();
      try { localStorage.setItem("faza-locale",link.dataset.locale!); } catch { /* Native fallback remains available. */ }
    },{signal:controller.signal});
  }
    apply();
  return () => controller.abort();
});
