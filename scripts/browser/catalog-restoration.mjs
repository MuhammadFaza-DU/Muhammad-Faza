globalThis.checkCatalogRestoration = async page => {
  const results = [];
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/v1/projects/*/comments**", route => route.request().method() === "GET"
    ? route.fulfill({ json: { comments: [], nextCursor: null, order: "asc" } }) : route.abort());
  await page.addInitScript(() => {
    document.addEventListener("astro:after-swap", () => {
      if (/\/project\/$/.test(window.location.pathname) && window.history.state?.fazaCatalogVisit) {
        const held = new Promise(resolve => { window.__releaseCatalogFonts = resolve; });
        Object.defineProperty(document.fonts, "ready", { configurable: true, get: () => held });
      }
    });
  });
  const frames = () => page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  for (const locale of ["id", "en"]) for (const mode of ["typing", "tab", "wheel", "touch", "ordinary", "leave"]) {
    await page.goto(`http://127.0.0.1:4321/${locale}/project/`, { waitUntil: "networkidle" });
    await page.locator('[data-project-id="tazk"] a').click();
    await page.waitForURL(`**/${locale}/project/tazk/`);
    await page.locator("[data-catalog-back]").click();
    await page.waitForSelector("[data-catalog-controls]:not([hidden])");
    const armed = await page.evaluate(() => typeof window.__releaseCatalogFonts === "function");
    if (mode === "typing") {
      await page.locator("[data-catalog-query]").focus();
      await page.keyboard.type("C");
    } else if (mode === "tab") {
      await page.keyboard.press("Tab");
    } else if (mode === "wheel") {
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(200);
    } else if (mode === "touch") {
      await page.evaluate(() => {
        document.dispatchEvent(new window.Event("touchstart", { bubbles: true }));
        window.scrollTo({ top: 120, behavior: "instant" });
      });
    } else if (mode === "leave") {
      await page.locator(`.gooey-nav__list:not([aria-hidden]) a[href="/${locale}/contact/"]`).click();
      await page.waitForURL(`**/${locale}/contact/`);
    }
    const before = await page.evaluate(() => {
      window.__catalogActiveBefore = document.activeElement;
      return { y: window.scrollY, query: document.querySelector("[data-catalog-query]")?.value };
    });
    await page.evaluate(() => window.__releaseCatalogFonts());
    await frames();
    if (mode === "typing") await page.keyboard.type("++");
    const after = await page.evaluate(() => ({
      sameFocus: document.activeElement === window.__catalogActiveBefore,
      focusedQuery: document.activeElement === document.querySelector("[data-catalog-query]"),
      card: document.activeElement?.closest("[data-catalog-card]")?.dataset.projectId,
      y: window.scrollY,
      visible: [...document.querySelectorAll("[data-catalog-card]:not([hidden])")].map(el => el.dataset.projectId),
      path: window.location.pathname,
    }));
    const passed = mode === "ordinary" ? after.card === "tazk" :
      mode === "typing" ? after.focusedQuery && after.visible.join() === "mini-notepad" :
      mode === "leave" ? after.path === `/${locale}/contact/` && after.sameFocus :
      after.sameFocus && Math.abs(after.y - before.y) < 2;
    results.push({ caseId: `${locale}/${mode}/late-restoration`, passed: armed && passed, actual: { armed, before, after } });
  }
  return { results, passed: results.every(result => result.passed) };
}
