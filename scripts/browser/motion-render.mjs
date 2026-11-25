globalThis.checkMotionRender=async page=>{
  const results=[],errors=[],consoleErrors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text());});
  for(const locale of ["id","en"])for(const width of [375,768,1440])for(const theme of ["light","dark"]){
    for(const route of ["","project/","project/portfolio/","contact/"]){
      await page.setViewportSize({width,height:950});
      await page.goto(`http://127.0.0.1:4321/${locale}/${route}`,{waitUntil:"networkidle"});
      if(!route)await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
      if(await page.locator("html").getAttribute("data-theme")!==theme){
        if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
        await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(1400);
      const actual=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth>window.innerWidth+1,
        heading:!!document.querySelector("h1")&&window.getComputedStyle(document.querySelector("h1")).visibility==="visible"&&
          +window.getComputedStyle(document.querySelector("h1")).opacity>.99,
        mainInert:document.querySelector("main").inert,headerInert:document.querySelector(".site-header").inert,
        mainTransform:window.getComputedStyle(document.querySelector("main")).transform,
        mainFilter:window.getComputedStyle(document.querySelector("main")).filter,
      }));
      const id=`${locale}/${width}/${theme}/${route||"home"}`;
      check(`${id}/readable-safe-geometry`,!actual.overflow&&actual.heading&&!actual.mainInert&&!actual.headerInert&&
        actual.mainTransform==="none"&&actual.mainFilter==="none",actual);
      if(locale==="en"&&[375,1440].includes(width)){
        await page.screenshot({path:`.superpowers/sdd/2026-11-15-motion-upgrade/${width}-${theme}-${route.replaceAll("/","-")||"home"}.png`});
      }
      if(!route&&locale==="en"&&width===1440&&theme==="dark"){
        for(const [name,selector] of [["stats",".portfolio-stats"],["skills",".skill-loop"],["hire","#hire"]]){
          if(name==="skills")await page.locator("#skills").scrollIntoViewIfNeeded();
          await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(1600);
          await page.screenshot({path:`.superpowers/sdd/2026-11-15-motion-upgrade/home-${name}-desktop.png`});
        }
      }
    }
  }
  check("no-page-errors",!errors.length,errors);
  check("no-console-errors",!consoleErrors.length,consoleErrors);
  return {passed:results.every(r=>r.passed),results,errors,consoleErrors};
}
