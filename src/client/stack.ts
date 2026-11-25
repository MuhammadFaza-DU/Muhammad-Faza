import { canStack } from "../lib/stack-fit";
import { registerPageEnhancement } from "./lifecycle";

// Native-window subset of React Bits ScrollStack, pinned at 4e0d091d.
// Coverage/depth is retained; smoothing, wheel hooks and snap are absent.
registerPageEnhancement("stack", () => {
  const root = document.querySelector<HTMLElement>(".featured-stack");
  if (!root) return () => {};
  const controller = new AbortController();
  let alive = true;
  const slots = [...root.querySelectorAll<HTMLElement>(".stack-slot")];
  const cards = slots.map(slot => slot.firstElementChild as HTMLElement);
  const spacers = [...root.querySelectorAll<HTMLElement>(".stack-spacer")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 47.99rem)");
  const heading = root.parentElement?.querySelector<HTMLElement>(".work-heading");
  let frame = 0;
  let focusInside = false;
  const measure = () => {
    frame = 0;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height")) || 0;
    const viewportHeight = window.visualViewport?.height ?? innerHeight;
    const offset = narrow.matches ? 12 : 20;
    const distance = narrow.matches ? 40 : 72;
    const titleSpace = !narrow.matches && heading ? heading.offsetHeight + parseFloat(getComputedStyle(heading).marginBottom) : 0;
    root.parentElement?.style.setProperty("--work-title-space",`${titleSpace}px`);
    const pin = header + 24 + titleSpace;
    const heights = cards.map(card => card.offsetHeight);
    const active = !reduced.matches && !focusInside && canStack({
      cardHeights:heights, headerHeight:header, viewportHeight, stackOffset:offset, pinGap:24 + titleSpace, bottomClearance:24,
    });
    const focused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    const pinnedCard = cards.findLast((card, i) => {
      const bounds = card.getBoundingClientRect();
      return bounds.top <= pin + i * offset + 1 && bounds.bottom > pin;
    });
    const visibleCard = pinnedCard ?? cards.find(card => {
      const bounds = card.getBoundingClientRect();
      return bounds.bottom > pin && bounds.top < viewportHeight;
    });
    const readingAnchor = (focused && root.contains(focused) ? focused : null) ?? visibleCard?.querySelector("h3") ?? visibleCard;
    const before = readingAnchor?.getBoundingClientRect().top;
    const changed = root.dataset.stack !== (active ? "active" : "flow");
    root.dataset.stack = active ? "active" : "flow";
    root.style.setProperty("--stack-pin",`${pin}px`);
    root.style.setProperty("--stack-offset",`${offset}px`);
    slots.forEach((slot,i) => {
      slot.style.marginBottom = active ? `${(slots.length - 1 - i) * offset}px` : "";
    });
    spacers.forEach((spacer,i) => { spacer.style.height = `${Math.max(0,distance - (slots.length - i - 1) * offset)}px`; });
    const tops = slots.map(slot => slot.getBoundingClientRect().top);
    const depths = slots.map(() => 0);
    if (active) for (let j = 1; j < slots.length; j++) {
      const pinBefore = pin + (j - 1) * offset;
      const start = pinBefore + heights[j - 1];
      const cover = Math.min(1,Math.max(0,(start - tops[j]) / Math.max(1,heights[j - 1] - offset)));
      for (let i = 0; i < j; i++) depths[i] += cover;
    }
    cards.forEach((card,i) => {
      card.style.transform = depths[i] > .0005 ? `scale(${Math.max(.9,1 - depths[i] * .035).toFixed(4)})` : "";
      card.style.setProperty("--stack-dim",(1 - Math.pow(.88,depths[i])).toFixed(3));
    });
    if (changed && readingAnchor && before !== undefined) {
      window.scrollBy({top:readingAnchor.getBoundingClientRect().top - before,behavior:"instant"});
    }
    if (heading && active && !narrow.matches) {
      const exit = root.getBoundingClientRect().bottom - heights[heights.length - 1] - titleSpace - (slots.length - 1) * offset;
      heading.style.setProperty("--work-heading-top",`${Math.min(header + 24,exit)}px`);
    } else heading?.style.removeProperty("--work-heading-top");
  };
  const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(measure); };
  const onFocus = () => { focusInside = true; measure(); };
  const onBlur = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    focusInside = false; schedule();
  };
  const observer = new ResizeObserver(schedule);
  cards.forEach(card => observer.observe(card));
  if (heading) observer.observe(heading);
  const header = document.querySelector(".site-header");
  if (header) observer.observe(header);
  const theme = new MutationObserver(schedule);
  theme.observe(document.documentElement,{attributes:true,attributeFilter:["style"]});
  root.addEventListener("focusin",onFocus);
  root.addEventListener("focusout",onBlur);
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule);
  window.visualViewport?.addEventListener("resize",schedule);
  reduced.addEventListener("change",schedule);
  narrow.addEventListener("change",schedule);
  document.fonts.ready.then(schedule);
  root.querySelectorAll<HTMLImageElement>("img").forEach(image => {
    const failure = () => {
      image.hidden = true;
      image.closest(".featured-image")!.querySelector<HTMLElement>(".media-failure")!.hidden = false;
      schedule();
    };
    image.addEventListener("error",failure,{signal:controller.signal});
    if (image.complete && !image.naturalWidth) failure();
  });
  window.addEventListener("pageshow",event => { if (event.persisted) schedule(); },{signal:controller.signal});
  schedule();
  return () => {
    alive = false;
    controller.abort();
    cancelAnimationFrame(frame);
    observer.disconnect(); theme.disconnect();
    window.removeEventListener("scroll",schedule);
    window.removeEventListener("resize",schedule);
    window.visualViewport?.removeEventListener("resize",schedule);
    reduced.removeEventListener("change",schedule);
    narrow.removeEventListener("change",schedule);
    root.removeEventListener("focusin",onFocus);
    root.removeEventListener("focusout",onBlur);
  };
});
