import { computeHeaderMode } from "../lib/header-fit";
import { registerPageEnhancement } from "./lifecycle";

registerPageEnhancement("header", () => {
const header = document.querySelector<HTMLElement>(".site-header");
const nav = header?.querySelector<HTMLElement>(".header-nav");
const trigger=header?.querySelector<HTMLButtonElement>("[data-preferences-trigger]");
const panel=header?.querySelector<HTMLElement>("[data-preferences-panel]");
const desktop=matchMedia("(min-width: 64rem)");
const controller=new AbortController();
const setPreferencesOpen=(open:boolean,restoreFocus=false)=>{
  if(!panel||!trigger||desktop.matches)return;
  panel.hidden=!open;
  trigger.setAttribute("aria-expanded",String(open));
  if(restoreFocus)trigger.focus({preventScroll:true});
};
const syncPreferences=()=>{
  if(!header||!panel||!trigger)return;
  const wasTriggerFocused=document.activeElement===trigger;
  const wasPanelFocused=panel.contains(document.activeElement);
  header.dataset.preferences=desktop.matches?"inline":"compact";
  trigger.hidden=desktop.matches;
  panel.hidden=!desktop.matches;
  trigger.setAttribute("aria-expanded","false");
  if(desktop.matches&&wasTriggerFocused)panel.querySelector<HTMLElement>("[data-language-toggle]")?.focus({preventScroll:true});
  if(!desktop.matches&&wasPanelFocused)trigger.focus({preventScroll:true});
};
syncPreferences();
desktop.addEventListener("change",syncPreferences,{signal:controller.signal});
trigger?.addEventListener("click",()=>setPreferencesOpen(panel?.hidden??false),{signal:controller.signal});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!desktop.matches&&panel&&!panel.hidden) {
    event.preventDefault();setPreferencesOpen(false,true);
  }
},{signal:controller.signal});
document.addEventListener("pointerdown",event=>{
  if(event.target instanceof Node&&!panel?.contains(event.target)&&!trigger?.contains(event.target))setPreferencesOpen(false);
},{signal:controller.signal});
document.addEventListener("focusin",event=>{
  if(event.target instanceof Node&&!panel?.contains(event.target)&&!trigger?.contains(event.target))setPreferencesOpen(false);
},{signal:controller.signal});
let scheduled = false;
let frame = 0;
let alive = true;
function measure() {
  scheduled = false;
  if (!alive || !header || !nav) return;
  const previous = header.dataset.mode;
  const navScroll = nav.scrollTop;
  header.dataset.mode = "normal";
  const fullHeight = header.getBoundingClientRect().height;
  const navHeight = nav.getBoundingClientRect().height + 16;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const mode = computeHeaderMode({ fullHeight, navHeight, viewportHeight });
  header.dataset.mode = mode;
  const fixed = mode === "normal" ? fullHeight : Math.min(navHeight, viewportHeight * .45);
  document.documentElement.style.setProperty("--fixed-header-height", `${Math.ceil(fixed)}px`);
  nav.scrollTop = navScroll;
  if (mode !== previous && document.activeElement instanceof HTMLElement) {
    const focused = document.activeElement;
    const rect = focused.getBoundingClientRect();
    if (focused !== document.body && (rect.top < fixed || rect.bottom > viewportHeight)) {
      focused.scrollIntoView({ block: "nearest" });
    }
  }
}
function schedule() {
  if (alive && !scheduled) { scheduled = true; frame = requestAnimationFrame(measure); }
}
const observer = new ResizeObserver(schedule);
if (header && nav) {
  observer.observe(header);
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  document.fonts.ready.then(schedule);
  schedule();
}
return () => {
  alive = false;
  controller.abort();
  cancelAnimationFrame(frame);
  observer.disconnect();
  window.removeEventListener("resize",schedule);
  window.visualViewport?.removeEventListener("resize",schedule);
};
});
