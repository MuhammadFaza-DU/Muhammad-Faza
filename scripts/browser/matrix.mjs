globalThis.checkRevisionMatrix = async page => {
  const results=[],errors=[],warnings=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(["warning","error"].includes(message.type()))warnings.push(message.text());});
  for(const width of [320,390,768,1024,1440])for(const locale of ["id","en"])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForFunction(()=>!document.querySelector("[data-theme-toggle]").disabled);
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
    const actual=await page.evaluate(()=>({
      locale:document.documentElement.lang,theme:document.documentElement.dataset.theme,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      h1:document.querySelectorAll("h1").length,profileCards:document.querySelectorAll(".profile-card").length,
      nav:[...document.querySelectorAll('.gooey-nav__list:not([aria-hidden]) a')].map(el=>({href:el.getAttribute("href"),current:el.getAttribute("aria-current")})),
      languageCodes:[...document.querySelectorAll("[data-language-dropdown] [data-locale]")].map(el=>el.textContent.trim()),
      justified:[...document.querySelectorAll(".intro-description p")].every(el=>window.getComputedStyle(el).textAlign==="justify"),
      eager:document.querySelector(".lanyard-fallback img").getAttribute("fetchpriority")==="high",
    }));
    const passed=actual.locale===locale&&actual.theme===theme&&actual.overflow<=1&&actual.h1===1&&actual.profileCards===1&&
      actual.justified&&actual.eager&&actual.nav.length===3&&actual.nav[0].current==="page"&&
      actual.nav[2].href===`/${locale}/contact/`&&actual.languageCodes.join(",")==="ID,EN";
    const capture=locale==="id"&&[390,1440].includes(width);
    const evidencePath=capture?`.superpowers/sdd/2026-11-14-home-revision-root/revision-home-${width}-${theme}.png`:null;
    if(capture) {
      await page.evaluate(()=>new Promise(resolve=>{let count=0;const tick=()=>++count===90?resolve():requestAnimationFrame(tick);tick();}));
      await page.mouse.move(0,200);
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
      await page.screenshot({path:evidencePath});
    }
    results.push({caseId:`home-${width}-${locale}-${theme}`,viewport:{width,height:900},locale,theme,
      action:"Open Home, switch theme, inspect rendered shell and intro",
      expected:"No overflow; localized three-route persistent nav; eager Lanyard; justified text; one hiring card",
      actual,passed,evidencePath});
  }
  return {results,errors,warnings,passed:results.every(item=>item.passed)&&!errors.length&&!warnings.length};
}
