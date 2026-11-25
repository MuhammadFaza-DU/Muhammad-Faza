globalThis.checkHiringContent=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const locale of ["id","en"])for(const width of [390,768,1024,1440,1920])for(const theme of ["light","dark"]){
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("#hire").scrollIntoViewIfNeeded();
    const actual=await page.locator("#hire").evaluate(el=>{
      const panel=el.querySelector(".hiring-copy"),heading=panel.querySelector("h2");
      const roles=panel.querySelector(".hiring-roles").getBoundingClientRect(),actions=panel.querySelector(".hiring-actions").getBoundingClientRect();
      const card=el.querySelector(".faza-profile").getBoundingClientRect(),box=panel.getBoundingClientRect();
      const blocks=[...panel.children].map(node=>({tag:node.tagName,box:node.getBoundingClientRect().toJSON()}));
      return {box:box.toJSON(),card:card.toJSON(),rolesToActions:actions.top-roles.bottom,
        gaps:blocks.slice(1).map((block,index)=>block.box.top-blocks[index].box.bottom),
        headingLines:heading.getBoundingClientRect().height/parseFloat(window.getComputedStyle(heading).lineHeight),
        paragraphs:[...panel.querySelectorAll(":scope > p")].map(p=>({text:p.textContent,box:p.getBoundingClientRect().toJSON()})),
        clipped:[...el.querySelectorAll("h2,p,li,a")].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.className),
        overflow:document.documentElement.scrollWidth>window.innerWidth+1};
    });
    const id=`${locale}/${width}/${theme}`;
    check(`${id}/content-reflows`,!actual.overflow&&!actual.clipped.length,actual);
    check(`${id}/real-explanatory-copy`,actual.paragraphs.some(p=>p.text.includes(locale==="id"?"App Web":"Web Apps")),actual.paragraphs);
    check(`${id}/actions-remain-grouped`,actual.rolesToActions<=64,actual);
    if(width>=1440){
      check(`${id}/no-vacant-interior`,Math.max(...actual.gaps)<=64,actual);
      check(`${id}/headline-hierarchy`,actual.headingLines<=1.1,actual);
      check(`${id}/balanced-occupied-panels`,Math.abs(actual.box.height-actual.card.height)<=40,actual);
    }
    check(`${id}/destinations-kept`,
      await page.locator("#hire .hiring-actions a").first().getAttribute("href")==="/assets/documents/Resume.pdf"&&
      await page.locator("#hire .hiring-projects").getAttribute("href")===`/${locale}/project/`&&
      await page.locator(`#hire .hiring-portrait a[href="/${locale}/contact/"]`).count()===1);
    if(locale==="id"&&[390,1440].includes(width))
      await page.locator("#hire").screenshot({path:`.superpowers/sdd/2026-11-16-hiring-content/${width}-${theme}.png`});
  }
  await page.setViewportSize({width:320,height:900});await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  await page.locator("#hire").scrollIntoViewIfNeeded();
  check("320-200percent-content-visible",await page.locator("#hire").evaluate(el=>
    document.documentElement.scrollWidth<=window.innerWidth+1&&[...el.querySelectorAll("h2,p,li,a")].every(n=>n.scrollWidth<=n.clientWidth+2)));
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  check("no-page-errors",errors.length===0,errors);
  return {passed:results.every(result=>result.passed),results,errors};
}
