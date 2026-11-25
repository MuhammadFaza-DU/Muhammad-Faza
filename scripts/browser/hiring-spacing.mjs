globalThis.checkHiringSpacing=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const locale of ["id","en"])for(const width of [390,768,896,1024,1440,1920])for(const theme of ["light","dark"]){
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("#hire").scrollIntoViewIfNeeded();
    const geometry=await page.locator("#hire").evaluate(el=>{
      const copy=el.querySelector(".hiring-copy").getBoundingClientRect(),portrait=el.querySelector(".hiring-portrait").getBoundingClientRect();
      const card=el.querySelector(".faza-profile").getBoundingClientRect(),outer=el.getBoundingClientRect();
      return {copy:copy.toJSON(),portrait:portrait.toJSON(),card:card.toJSON(),
        visibleGap:portrait.left-copy.right,rightUnused:outer.right-portrait.right,
        ratio:copy.width/portrait.width,overflow:document.documentElement.scrollWidth>window.innerWidth+1,
        clipped:[...el.querySelectorAll("h2,p,li,a")].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.className)};
    });
    const id=`${locale}/${width}/${theme}`;
    if(width>=896){
      check(`${id}/real-gap-32px`,Math.abs(geometry.visibleGap-32)<1,geometry);
      check(`${id}/no-unused-right-track`,Math.abs(geometry.rightUnused)<1&&Math.abs(geometry.card.width-geometry.portrait.width)<1,geometry);
      check(`${id}/v1-like-proportions`,Math.abs(geometry.ratio-1.35/.65)<.02,geometry);
      check(`${id}/aligned-top`,Math.abs(geometry.copy.top-geometry.portrait.top)<1,geometry);
    }else{
      check(`${id}/phone-stays-stacked`,geometry.portrait.top>=geometry.copy.bottom+32,geometry);
      check(`${id}/phone-card-size-preserved`,geometry.portrait.width<=352.1,geometry);
    }
    check(`${id}/no-overflow-or-clipped-text`,!geometry.overflow&&!geometry.clipped.length,geometry);
    check(`${id}/actions-preserved`,
      await page.locator('#hire .hiring-actions a').first().getAttribute("href")==="/assets/documents/Resume.pdf"&&
      await page.locator('#hire .hiring-projects').getAttribute("href")===`/${locale}/project/`&&
      await page.locator(`#hire .hiring-portrait a[href="/${locale}/contact/"]`).count()===1);
    if(locale==="en"&&[390,1440].includes(width)&&theme==="light")
      await page.locator("#hire").screenshot({path:`.superpowers/sdd/2026-11-16-hiring-spacing/${width}-after.png`});
  }
  await page.setViewportSize({width:320,height:900});await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  await page.locator("#hire").scrollIntoViewIfNeeded();
  check("320-200percent-no-clipping",await page.locator("#hire").evaluate(el=>
    document.documentElement.scrollWidth<=window.innerWidth+1&&
    [...el.querySelectorAll("h2,p,li,a")].every(n=>n.scrollWidth<=n.clientWidth+2)));
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(result=>result.passed),results,errors};
}
