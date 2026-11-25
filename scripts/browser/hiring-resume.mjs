globalThis.checkHiringResume=async page=>{
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const width of [390,1440])for(const theme of ["light","dark"]){
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const hiring=page.locator("#hire"),resume=hiring.locator(".hiring-actions a").first();
    await hiring.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll("#hire [data-reveal-state]")].every(el=>
      el.getAttribute("data-reveal-state")==="settled")&&document.documentElement.dataset.routePhase!=="entering");
    const prefix=`${locale}/${width}/${theme}`;
    results.push({caseId:`${prefix}/resume-link`,passed:await resume.getAttribute("href")==="/assets/documents/Resume.pdf"&&
      await resume.textContent()===(locale==="id"?"Lihat resume":"View resume")});
    results.push({caseId:`${prefix}/projects-unchanged`,passed:await hiring.locator(".hiring-projects").getAttribute("href")===`/${locale}/project/`});
    results.push({caseId:`${prefix}/card-contact-unchanged`,passed:await hiring.locator('.hiring-portrait a[href*="/contact/"]').count()===1});
    const geometry=await hiring.evaluate(el=>({local:el.scrollWidth-el.clientWidth,page:document.documentElement.scrollWidth-window.innerWidth}));
    results.push({caseId:`${prefix}/no-overflow`,passed:geometry.local<=1&&geometry.page<=1,actual:geometry});
    await resume.focus();await page.keyboard.press("Tab");await page.keyboard.press("Shift+Tab");
    results.push({caseId:`${prefix}/keyboard-visible-focus`,passed:await resume.evaluate(el=>el===document.activeElement&&window.getComputedStyle(el).outlineStyle!=="none")});
    const popupPromise=page.waitForEvent("popup");
    await page.keyboard.press("Enter");const popup=await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    results.push({caseId:`${prefix}/resume-opens-real-pdf`,passed:popup.url().includes("/assets/documents/Resume.pdf")});
    await popup.close();
    if(locale==="en"&&theme==="light")await hiring.screenshot({path:`.superpowers/sdd/2026-11-16-persistent-project-comments/hiring-resume-${width}.png`});
  }
  const response=await page.request.get("http://127.0.0.1:4321/assets/documents/Resume.pdf");
  results.push({caseId:"real-pdf-response",passed:response.status()===200&&response.headers()["content-type"].includes("application/pdf")});
  results.push({caseId:"no-page-errors",passed:errors.length===0,actual:errors});
  return {passed:results.every(result=>result.passed),results};
}
