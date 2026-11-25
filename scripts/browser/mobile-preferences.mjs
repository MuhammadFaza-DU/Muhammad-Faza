globalThis.checkMobilePreferences = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  for(const locale of ["id","en"])for(const width of [320,390,533,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:4321/${locale}/contact/`,{waitUntil:"networkidle"});
    const options=(await page.locator("[data-language-dropdown] [data-locale]").allTextContents()).map(code=>code.trim());
    check(`${locale}/${width}/short-options`,options.join(",")==="ID,EN",options);
    const trigger=page.locator("[data-preferences-trigger]"),panel=page.locator("[data-preferences-panel]");
    if(width>=1024) {
      check(`${locale}/${width}/inline-desktop`,await panel.isVisible()&&!await trigger.isVisible());
      continue;
    }
    if(!await trigger.count()) {check(`${locale}/${width}/burger-present`,false);continue;}
    const layout=await page.evaluate(()=>{
      const header=document.querySelector(".site-header").getBoundingClientRect();
      const brand=document.querySelector(".site-header .brand").getBoundingClientRect();
      const links=[...document.querySelectorAll(".header-nav .gooey-nav__list:not([aria-hidden]) a")].map(a=>a.getBoundingClientRect());
      const trigger=document.querySelector("[data-preferences-trigger]").getBoundingClientRect();
      return {height:header.height,sameRow:links.every(b=>Math.abs(b.top-brand.top)<6)&&Math.abs(trigger.top-brand.top)<6,overflow:document.documentElement.scrollWidth-window.innerWidth};
    });
    check(`${locale}/${width}/single-row`,layout.height<=70&&layout.sameRow&&layout.overflow<=1,layout);
    check(`${locale}/${width}/closed-initially`,!await panel.isVisible());
    await trigger.click();
    check(`${locale}/${width}/open`,await panel.isVisible()&&await trigger.getAttribute("aria-expanded")==="true");
    const before=await page.locator("html").getAttribute("data-theme");
    await page.locator("[data-theme-toggle]").click();
    check(`${locale}/${width}/theme-works`,await page.locator("html").getAttribute("data-theme")!==before);
    await page.keyboard.press("Escape");
    check(`${locale}/${width}/escape-restores-focus`,!await panel.isVisible()&&await trigger.evaluate(el=>el===document.activeElement));
    await trigger.click();
    await page.mouse.click(4,300);
    check(`${locale}/${width}/outside-closes`,!await panel.isVisible());
    await trigger.focus();await page.keyboard.press("Enter");await page.keyboard.press("Tab");
    check(`${locale}/${width}/keyboard-language`,await page.locator("[data-language-toggle]").evaluate(el=>el===document.activeElement));
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto("http://127.0.0.1:4321/en/contact/?source=mobile#contact-title",{waitUntil:"networkidle"});
  await page.locator("[data-preferences-trigger]").click();
  await page.locator("[data-language-toggle]").click();
  await page.locator('[data-language-dropdown] [data-locale="id"]').click();
  await page.waitForURL("**/id/contact/?source=mobile#contact-title");
  await page.waitForFunction(()=>!!document.querySelector('[data-language-dropdown] [data-locale="id"][aria-current]'));
  check("mobile-locale/route-query-hash",true);
  check("mobile-locale/new-panel-closed",!await page.locator("[data-preferences-panel]").isVisible());
  await page.locator("[data-preferences-trigger]").click();
  await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>document.querySelector(".site-header")?.dataset.preferences==="inline");
  check("open-mobile-to-desktop/inline",await page.locator("[data-preferences-panel]").isVisible());
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector(".site-header")?.dataset.preferences==="compact");
  check("desktop-to-mobile/closes",!await page.locator("[data-preferences-panel]").isVisible());
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  check("large-text/no-horizontal-overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
