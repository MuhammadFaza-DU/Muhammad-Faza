globalThis.checkOwnerRegressions=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const [width,height] of [[1920,1080],[1920,900],[1536,864],[1440,900],[1280,720],[768,1024],[390,844],[533,653]]){
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:"no-preference"});
    await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    await page.locator(".skill-showcase").scrollIntoViewIfNeeded();
    const geometry=await page.locator(".featured-stack").evaluate(root=>({
      mode:root.dataset.stack,viewport:window.visualViewport.height,header:parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height")),
      titleSpace:root.parentElement.style.getPropertyValue("--work-title-space"),
      cards:[...root.querySelectorAll(".featured-card")].map(el=>el.offsetHeight),
    }));
    check(`${width}x${height}/five-card-scrollstack-active`,geometry.mode==="active",geometry);
    const button=page.locator('[aria-controls="all-skills"]');
    await button.click();await page.waitForTimeout(300);
    await page.locator("#all-skills").evaluate(el=>{
      window.disclosureCloseTrace=[];
      const probe=()=>{
        const style=window.getComputedStyle(el);
        window.disclosureCloseTrace.push({hidden:el.hidden,height:el.getBoundingClientRect().height,
          overflow:style.overflow,opacity:Number(style.opacity),running:el.getAnimations().some(a=>a.playState==="running")});
      };
      window.closeObserver=new window.MutationObserver(probe);window.closeObserver.observe(el,{attributes:true});
      probe();
    });
    await button.click();await page.waitForTimeout(280);
    const trace=await page.evaluate(()=>{window.closeObserver.disconnect();return window.disclosureCloseTrace;});
    const exposed=trace.filter(row=>!row.hidden&&row.height<1&&row.opacity>.01&&row.overflow!=="hidden"&&row.overflow!=="clip");
    check(`${width}x${height}/close-never-reexposes-content`,exposed.length===0,exposed);
    check(`${width}x${height}/close-hidden-final`,await page.locator("#all-skills").evaluate(el=>el.hidden));
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
