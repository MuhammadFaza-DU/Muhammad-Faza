globalThis.checkLanyardMotionRace = async page => {
  const results = [];
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const target = await context.newPage();
  await target.addInitScript(() => {
    const fonts = new Promise(resolve => { window.__qaReleaseHeroFonts = resolve; });
    Object.defineProperty(document.fonts, "ready", { configurable: true, get: () => fonts });
    const match = window.matchMedia.bind(window);
    window.__qaMediaLists = [];
    window.matchMedia = query => {
      const media = match(query);
      if (query === "(prefers-reduced-motion: reduce)") {
        const descriptor = Object.getOwnPropertyDescriptor(window.MediaQueryList.prototype, "matches");
        Object.defineProperty(media, "matches", { get: () => window.__qaMotionOverride ?? descriptor.get.call(media) });
        window.__qaMediaLists.push(media);
      }
      return media;
    };
  });
  try {
    await target.goto("http://127.0.0.1:4321/id/", { waitUntil: "domcontentloaded" });
    await target.waitForFunction(() => document.querySelector(".lanyard-portrait")?.dataset.ready === "true", null, { timeout: 15000 });
    for (let round = 0; round < 3; round++) {
      await target.evaluate(() => {
        for (const reduced of [true, false]) {
          window.__qaMotionOverride = reduced;
          for (const media of [...window.__qaMediaLists]) media.dispatchEvent(new window.Event("change"));
        }
        delete window.__qaMotionOverride;
        window.__qaReleaseHeroFonts();
      });
      let error = null;
      try {
        await target.waitForFunction(() => document.querySelector(".lanyard-portrait")?.dataset.ready === "true", null, { timeout: 5000 });
        await target.waitForFunction(() => document.documentElement.dataset.opening === "complete", null, { timeout: 15000 });
      } catch (failure) { error = failure.name; }
      const state = await target.evaluate(() => ({
        ready: document.querySelector(".lanyard-portrait")?.dataset.ready,
        reduced: document.querySelector(".lanyard-portrait")?.dataset.reduced,
        engineReady: document.querySelector(".lanyard")?.dataset.ready,
        canvases: document.querySelectorAll(".lanyard-canvas").length,
        opening: document.documentElement.dataset.opening,
      }));
      results.push({ caseId: `batched-reduce-return-${round + 1}`, passed: !error && state.ready === "true" &&
        state.reduced === "false" && state.engineReady === "true" && state.canvases === 1 &&
        state.opening === "complete", actual: { state, error } });
    }
    await target.locator(".lanyard-flip").focus();
    await target.keyboard.press("Enter");
    results.push({ caseId: "keyboard-flip-retained", passed: await target.locator(".lanyard-portrait").getAttribute("data-face") === "back" });
  } finally { await context.close(); }
  return { results, passed: results.every(row => row.passed) };
}
