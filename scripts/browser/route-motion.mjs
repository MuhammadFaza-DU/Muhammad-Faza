globalThis.checkRouteMotion=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.routeFrames=[];
    const tick=()=>{
      const main=document.querySelector("main");
      if(main)window.routeFrames.push({page:document.documentElement.dataset.pageKind,
        phase:document.documentElement.dataset.routePhase,opacity:+window.getComputedStyle(main).opacity,
        header:window.getComputedStyle(document.querySelector(".site-header")).visibility,
        filter:window.getComputedStyle(main).filter,transform:window.getComputedStyle(main).transform});
      if(window.routeFrames.length<3000)requestAnimationFrame(tick);
    };requestAnimationFrame(tick);
  });
  for(const locale of ["id","en"]){
    await page.goto(`http://127.0.0.1:4321/${locale}/contact/`,{waitUntil:"networkidle"});
    for(const target of ["project/","project/gamein/","","contact/"]){
      await page.evaluate(()=>window.routeFrames=[]);
      if(target==="project/gamein/")await page.locator(`[data-catalog-card] a[href="/${locale}/${target}"]`).click();
      else await page.locator(`.gooey-nav__list:not([aria-hidden]) a[href="/${locale}/${target}"]`).click();
      await page.waitForURL(`**/${locale}/${target}`);
      await page.waitForFunction(()=>document.documentElement.dataset.routePhase==="settled",null,{timeout:15000});
      if(!target)await page.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:20000});
      const samples=await page.evaluate(()=>window.routeFrames);
      check(`${locale}/${target||"home"}/incoming-without-outgoing-delay`,!samples.some(f=>f.phase==="leaving")&&
        samples.some(f=>f.phase==="entering"&&f.opacity>.05&&f.opacity<.95),samples.slice(0,4));
      check(`${locale}/${target||"home"}/header-and-safe-ancestors`,samples.every(f=>f.header==="visible"&&f.filter==="none"&&f.transform==="none"));
    }
    await page.goBack();await page.waitForURL(`**/${locale}/`);
    await page.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:20000});
    check(`${locale}/history-home-no-MF`,!await page.locator(".opening-screen").isVisible());
    await page.goForward();await page.waitForURL(`**/${locale}/contact/`);
    await page.waitForFunction(()=>document.documentElement.dataset.routePhase==="settled");
    check(`${locale}/history-contact-readable`,await page.locator("main").evaluate(el=>+window.getComputedStyle(el).opacity===1));
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
