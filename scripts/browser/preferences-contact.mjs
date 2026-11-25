globalThis.checkPreferencesContact = async page => {
  const origin="http://127.0.0.1:4321",results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  await page.goto(`${origin}/en/contact/`,{waitUntil:"networkidle"});
  for(const width of [320,390,768,1024,1440])for(const locale of ["id","en"])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`${origin}/${locale}/contact/`,{waitUntil:"networkidle"});
    await page.waitForFunction(()=>!document.querySelector("[data-theme-toggle]").disabled);
    const current=await page.locator("html").getAttribute("data-theme");
    if(current!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.evaluate(async()=>{await document.fonts.ready;document.activeElement?.blur();window.scrollTo(0,0);});
    await page.waitForFunction(()=>document.querySelector(".gooey-nav__list--active")?.style.clipPath.includes("A"));
    await page.waitForFunction(target=>document.querySelector(".gooey-nav").style.getPropertyValue("--gn-active-ink")===(target==="dark"?"#0A0A0A":"#FFFFFF"),theme);
    const actual=await page.evaluate(()=>({
      theme:document.documentElement.dataset.theme,locale:document.documentElement.lang,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      channels:document.querySelectorAll(".social-channel").length,
      missingIcons:[...document.querySelectorAll(".social-channel img")].filter(img=>img.complete&&!img.naturalWidth).length,
      systemOptions:[...document.querySelectorAll("option")].filter(option=>option.value==="system").length,
      githubVisible:document.documentElement.dataset.theme==="dark" || window.getComputedStyle(document.querySelector(".social-channel[href*=github] img")).filter==="brightness(0)",
      navInk:window.getComputedStyle(document.querySelector(".gooey-nav__list--active .gooey-nav__link")).color,
    }));
    check(`${width}/${locale}/${theme}`,actual.theme===theme&&actual.locale===locale&&actual.overflow<=1&&actual.channels===6&&!actual.missingIcons&&!actual.systemOptions&&actual.githubVisible&&actual.navInk===(theme==="dark"?"rgb(10, 10, 10)":"rgb(255, 255, 255)"),actual);
    if([390,1440].includes(width)&&locale==="id")await page.screenshot({path:`.superpowers/sdd/2026-11-14-home-revision-root/contact-${width}-${theme}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`${origin}/en/contact/?source=review#contact-title`,{waitUntil:"networkidle"});
   await page.locator("[data-language-toggle]").click();
   await page.locator('[data-language-dropdown] [data-locale="id"]').click();
  await page.waitForURL("**/id/contact/?source=review#contact-title");
  await page.waitForFunction(()=>document.documentElement.lang==="id");
  check("dropdown/preserves-contact-query-hash",true);
  if(await page.locator("html").getAttribute("data-theme")!=="dark")await page.locator("[data-theme-toggle]").click();
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(1).click();
  await page.waitForURL("**/id/project/");
   await page.waitForFunction(()=>!!document.querySelector('[data-language-dropdown] [data-locale="id"][aria-current]'));
  check("theme/persists-router",await page.locator("html").getAttribute("data-theme")==="dark");
  await page.reload({waitUntil:"networkidle"});
  check("theme/persists-reload",await page.locator("html").getAttribute("data-theme")==="dark");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
  await page.waitForURL("**/id/contact/");
   check("form/replaces-right-email-controls",await page.locator("[data-contact-form]").count()===1&&await page.locator(".contact-direct [data-copy-email],.contact-direct .contact-address").count()===0);
   check("form/resume-only-link-in-right-panel",await page.locator('.contact-direct a[href="/assets/documents/Resume.pdf"]').count()===1&&await page.locator(".contact-direct a").count()===1);
  await page.setViewportSize({width:390,height:400});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   check("200%-short/header-fit",await page.locator(".site-header").evaluate(el=>el.dataset.mode!=="normal"||el.getBoundingClientRect().height<=window.innerHeight*.45));
  check("200%-short/no-overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  const browser=page.context().browser();
  const darkOs=await browser.newContext({colorScheme:"dark",viewport:{width:390,height:844}});
  const fresh=await darkOs.newPage();
  await fresh.goto(`${origin}/en/contact/`,{waitUntil:"networkidle"});
  check("fresh-os-dark/default-light",await fresh.locator("html").getAttribute("data-theme")==="light");
  await darkOs.close();
  const blocked=await browser.newContext({colorScheme:"dark"});
  const restricted=await blocked.newPage();
  await restricted.addInitScript(()=>{
    window.Storage.prototype.getItem=()=>{throw new window.DOMException("blocked","SecurityError");};
    window.Storage.prototype.setItem=()=>{throw new window.DOMException("blocked","SecurityError");};
  });
  await restricted.goto(`${origin}/en/contact/`,{waitUntil:"networkidle"});
  check("blocked-storage/default-light",await restricted.locator("html").getAttribute("data-theme")==="light");
  await restricted.locator("[data-theme-toggle]").click();
  await restricted.locator('.gooey-nav__list:not([aria-hidden]) a').nth(1).click();
  await restricted.waitForURL("**/en/project/");
  await restricted.waitForFunction(()=>document.querySelector("[data-theme-toggle]")?.disabled===false);
  check("blocked-storage/session-toggle",await restricted.locator("html").getAttribute("data-theme")==="dark");
  await blocked.close();
  const noJs=await browser.newContext({javaScriptEnabled:false,colorScheme:"dark"});
  const plain=await noJs.newPage();
  await plain.goto(`${origin}/en/contact/`);
  check("no-js/content-native-links",await plain.locator(".social-channel").count()===6&&await plain.locator('a[href="/id/contact/"]').count()===1);
  check("no-js/default-light",await plain.locator("html").evaluate(el=>window.getComputedStyle(el).colorScheme==="light"));
  await noJs.close();
  return {results,errors,passed:results.every(result=>result.passed)&&!errors.length};
}
