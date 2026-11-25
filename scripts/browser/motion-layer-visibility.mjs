globalThis.checkMotionLayerVisibility=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});
    for(const route of ["contact/","project/portfolio/",""]){
      await page.goto(`http://127.0.0.1:4321/${locale}/${route}`,{waitUntil:"networkidle"});
      if(!route){
        await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
        await page.locator("#skills").scrollIntoViewIfNeeded();
        await page.waitForSelector(".skill-showcase[data-enhanced]");
      }
      const targets=page.locator("[data-motion-scroll],[data-motion-enter]");
      for(let i=0;i<await targets.count();i++){
        const target=targets.nth(i);
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1400);
        const actual=await target.evaluate(el=>{
          const visible=node=>{
            let opacity=1;
            for(let n=node;n;n=n.parentElement){
              const style=window.getComputedStyle(n);
              if(style.display==="none"||style.visibility!=="visible")return 0;
              opacity*=+style.opacity;
            }
            return opacity;
          };
          const layers=[...el.querySelectorAll(":scope > [data-motion-layer],:scope > [data-motion-enter]")];
          return {kind:el.dataset.motionScroll||el.className,opacity:visible(el),
            layers:layers.map(n=>({className:n.className,opacity:visible(n)}))};
        });
        check(`${locale}/${width}/${route||"home"}/${i}/ancestor-and-layers-visible`,
          actual.opacity>.99&&actual.layers.every(n=>n.opacity>.99),actual);
      }
    }
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
