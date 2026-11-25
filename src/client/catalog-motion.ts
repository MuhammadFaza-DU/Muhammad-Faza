import { registerPageEnhancement } from "./lifecycle";
import type { CatalogResultsDetail } from "./catalog";

registerPageEnhancement("catalog-motion", () => {
  const root = document.querySelector<HTMLElement>("[data-catalog]");
  if (!root) return () => {};
  const controller = new AbortController(), { signal } = controller;
  const list = root.querySelector<HTMLElement>(".catalog-list")!;
  const cards = [...list.querySelectorAll<HTMLElement>("[data-catalog-card]")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const ease = getComputedStyle(root).getPropertyValue("--ease-out").trim();
  const moveEase = getComputedStyle(root).getPropertyValue("--ease-in-out").trim();
  const animations = new Map<HTMLElement, Animation>();
  const ghosts = new Set<HTMLElement>();
  const armed = new WeakMap<HTMLElement, boolean>();
  let pressed = false, queued: CatalogResultsDetail | null = null, releaseTimer = 0;

  const cancel = () => {
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    for (const ghost of ghosts) ghost.remove();
    ghosts.clear();
  };
  const play = (element: HTMLElement, frames: Keyframe[], duration: number, delay = 0, moving = false) => {
    element.dataset.catalogRevealed="true";
    animations.get(element)?.cancel();
    const animation = element.animate(frames, { duration, delay, easing: moving ? moveEase : ease, fill: "backwards" });
    animations.set(element, animation);
    const finish = () => {
      if (animations.get(element) === animation) {
        animations.delete(element);
        const box = element.getBoundingClientRect();
        if (!ghosts.has(element) && !element.hidden && (box.bottom <= 0 || box.top >= window.innerHeight)) armed.set(element, true);
      }
      if (ghosts.has(element)) { element.remove(); ghosts.delete(element); }
    };
    void animation.finished.then(finish, finish);
    if (pressed) animation.pause();
  };
  const results = (detail: CatalogResultsDetail) => {
    const old = new Map(cards.filter(card => !card.hidden).map(card => [card, card.getBoundingClientRect()]));
    cancel();
    const listBox = list.getBoundingClientRect();
    const exits = new Map<HTMLElement, DOMRect>();
    for (const [card, box] of old) {
      if (detail.visibleIds.includes(card.dataset.projectId!)) continue;
      const ghost = card.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-catalog-card");
      ghost.removeAttribute("data-project-id");
      ghost.removeAttribute("data-catalog-reveal");
      ghost.dataset.catalogExit = "";
      ghost.setAttribute("aria-hidden", "true");
      ghost.inert = true;
      for (const element of ghost.querySelectorAll("[id]")) element.removeAttribute("id");
      for (const anchor of ghost.querySelectorAll("a")) { anchor.removeAttribute("href"); anchor.removeAttribute("aria-labelledby"); }
      Object.assign(ghost.style, {
        position: "absolute", left: `${box.left - listBox.left}px`, top: `${box.top - listBox.top}px`,
        width: `${box.width}px`, height: `${box.height}px`, pointerEvents: "none", zIndex: "1",
      });
      list.append(ghost);
      ghosts.add(ghost);
      exits.set(ghost, box);
      play(ghost, [{ opacity: 1 }, { opacity: 0 }], 200);
    }
    detail.apply();
    const nextListBox = list.getBoundingClientRect();
    for (const [ghost, box] of exits) {
      ghost.style.left = `${box.left - nextListBox.left}px`;
      ghost.style.top = `${box.top - nextListBox.top}px`;
    }
    for (const card of cards.filter(card => !card.hidden)) {
      armed.set(card, false);
      const before = old.get(card), after = card.getBoundingClientRect();
      if (before && !reduce.matches) {
        const x = before.left - after.left, y = before.top - after.top;
        if (Math.abs(x) + Math.abs(y) > .5) play(card, [{ transform: `translate(${x}px, ${y}px)` }, { transform: "none" }], 420, 0, true);
      } else if (!before) {
        play(card, [{ opacity: .05 }, { opacity: 1 }], reduce.matches ? 200 : 500);
      }
    }
  };
  root.addEventListener("faza:catalog-results", event => {
    event.preventDefault();
    const detail = (event as CustomEvent<CatalogResultsDetail>).detail;
    if (pressed) queued = detail;
    else results(detail);
  }, { signal });
  root.addEventListener("pointerdown", event => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-catalog-card]") || !event.isPrimary) return;
    pressed = true;
    for (const animation of animations.values()) {
      const time = animation.currentTime;
      animation.pause();
      animation.currentTime = time;
    }
  }, { signal, capture: true });
  const release = () => {
    clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => {
      if (signal.aborted) return;
      pressed = false;
      for (const animation of animations.values()) animation.play();
      const latest = queued;
      queued = null;
      if (latest) results(latest);
    }, 0);
  };
  window.addEventListener("pointerup", release, { signal });
  window.addEventListener("pointercancel", release, { signal });
  window.addEventListener("blur", release, { signal });
  window.addEventListener("resize", cancel, { signal });
  reduce.addEventListener("change", cancel, { signal });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancel(); }, { signal });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const card = entry.target as HTMLElement;
      if (!entry.isIntersecting) {
        if (!animations.has(card)) armed.set(card, true);
      } else if (armed.get(card) && !card.hidden) {
        armed.set(card, false);
        if (!card.contains(document.activeElement) && !pressed) {
          play(card, [{ opacity: .08 }, { opacity: 1 }], reduce.matches ? 420 : 1000,
            reduce.matches ? 0 : (cards.indexOf(card) % 4) * 80);
        } else {
          card.dataset.catalogRevealed="true";
        }
      }
    }
  }, { threshold: 0 });
  const observe=()=>{
    if(document.documentElement.dataset.routePhase==="entering"&&document.documentElement.dataset.routeVisible!=="true")return;
    for (const card of cards) { if(armed.has(card))continue;armed.set(card, true); observer.observe(card); }
  };
  document.addEventListener("faza:route-visible",observe,{signal});
  root.addEventListener("focusin",event=>{
    if(pressed)return;
    const card=event.target instanceof Element?event.target.closest<HTMLElement>("[data-catalog-card]"):null;
    if(card){card.dataset.catalogRevealed="true";animations.get(card)?.cancel();animations.delete(card);}
  },{signal});
  observe();
  return () => {
    controller.abort();
    observer.disconnect();
    clearTimeout(releaseTimer);
    cancel();
    queued = null;
  };
});
