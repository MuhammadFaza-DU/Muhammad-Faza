globalThis.checkLanguageDropdown = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  for(const width of [390,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:900});
    await page.goto("http://127.0.0.1:4321/en/contact/?review=dropdown#contact-title",{waitUntil:"networkidle"});
    const dropdown=page.locator("[data-language-dropdown]");
    if(!await dropdown.count()){check(`${width}/${theme}/themed-picker-exists`,false);continue;}
    const burger=page.locator("[data-preferences-trigger]");
    if(!await page.locator("[data-theme-toggle]").isVisible())await burger.click();
    if(await page.locator("html").getAttribute("data-theme")!==theme)await page.locator("[data-theme-toggle]").click();
    const shell=await page.locator(".site-header").evaluate(el=>{
      const style=window.getComputedStyle(el),color=style.backgroundColor;
      return {color,alpha:color.includes("/")?Number(color.split("/")[1].replace(")","").trim()):Number(color.match(/[\d.]+/g)?.[3]??1),
        blur:style.backdropFilter,navBackground:window.getComputedStyle(el.querySelector(".header-nav")).backgroundColor};
    });
    check(`${width}/${theme}/translucent-nav-shell`,shell.alpha>=.85&&shell.alpha<1&&shell.blur.includes("blur")&&shell.navBackground==="rgba(0, 0, 0, 0)",shell);
    const trigger=page.locator("[data-language-toggle]");
    await trigger.click();
    const actual=await dropdown.evaluate(el=>{
      const panel=el.querySelector(".language-options"),active=el.querySelector("[aria-current]");
      const panelStyle=window.getComputedStyle(panel),activeStyle=window.getComputedStyle(active);
      return {nativeSelects:el.querySelectorAll("select").length,open:el.open,
        radius:parseFloat(panelStyle.borderRadius),background:panelStyle.backgroundColor,
        activeBackground:activeStyle.backgroundColor,activeColor:activeStyle.color,
        codes:[...el.querySelectorAll("a")].map(a=>a.textContent.trim()),
        targets:[...el.querySelectorAll("a")].every(a=>a.getBoundingClientRect().height>=44)};
    });
    check(`${width}/${theme}/matches-design-system`,actual.open&&!actual.nativeSelects&&actual.radius>=8&&actual.codes.join(",")==="ID,EN"&&actual.targets&&actual.activeBackground===(theme==="light"?"rgb(16, 16, 16)":"rgb(245, 245, 245)"),actual);
    await page.keyboard.press("Escape");
    check(`${width}/${theme}/escape-only-language`,await dropdown.getAttribute("open")===null&&await trigger.evaluate(el=>el===document.activeElement)&&await page.locator("[data-preferences-panel]").isVisible());
    await trigger.focus();await page.keyboard.press("ArrowDown");
    check(`${width}/${theme}/keyboard-opens`,await dropdown.getAttribute("open")!==null&&await dropdown.locator("a[aria-current]").evaluate(el=>el===document.activeElement));
    await page.keyboard.press("Home");
    check(`${width}/${theme}/home-first-option`,await dropdown.locator("a").first().evaluate(el=>el===document.activeElement));
    await page.keyboard.press("End");
    check(`${width}/${theme}/end-last-option`,await dropdown.locator("a").last().evaluate(el=>el===document.activeElement));
    await page.mouse.click(4,300);
    check(`${width}/${theme}/outside-dismiss`,await dropdown.getAttribute("open")===null);
    if(await burger.isVisible()&&!await page.locator("[data-preferences-panel]").isVisible())await burger.click();
    await trigger.click();
    await dropdown.locator('[data-locale="id"]').click();
    await page.waitForURL("**/id/contact/?review=dropdown#contact-title");
    check(`${width}/${theme}/localized-navigation`,await page.locator("html").getAttribute("lang")==="id");
  }
  const context=await page.context().browser().newContext({javaScriptEnabled:false});
  const plain=await context.newPage();
  await plain.goto("http://127.0.0.1:4321/en/contact/");
  if(await plain.locator("[data-language-toggle]").count()) {
    await plain.locator("[data-language-toggle]").click();
    await plain.locator('[data-language-dropdown] [data-locale="id"]').click();
    await plain.waitForURL("**/id/contact/");
    check("no-js/native-navigation",true);
  } else check("no-js/native-navigation",false);
  await context.close();
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
