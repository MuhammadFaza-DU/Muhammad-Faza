globalThis.checkContactMotionVisibility=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const width of [390,1440])for(const viaRouter of [false,true]){
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/${viaRouter?"project/":"contact/"}`,{waitUntil:"networkidle"});
    if(viaRouter){
      await page.locator(`.gooey-nav__list:not([aria-hidden]) a[href="/${locale}/contact/"]`).click();
      await page.waitForURL(`**/${locale}/contact/`);
    }
    const left=page.locator(".social-profiles");
    await left.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1700);
    const actual=await left.evaluate(el=>{
      const effective=node=>{
        let opacity=1;for(let n=node;n;n=n.parentElement){
          const s=window.getComputedStyle(n);
          if(s.display==="none"||s.visibility!=="visible"||n.inert)return 0;
          opacity*=Number(s.opacity);
        }return opacity;
      };
      return {parent:effective(el),heading:effective(el.querySelector("h2")),
        cards:[...el.querySelectorAll(".social-channel")].map(a=>({name:a.textContent.trim(),opacity:effective(a)})),
        targetSettled:el.dataset.motionSettled,layers:[...el.querySelectorAll("[data-motion-layer]")].map(n=>n.dataset.revealState)};
    });
    const id=`${locale}/${width}/${viaRouter?"router":"direct"}`;
    check(`${id}/all-left-content-really-visible`,actual.parent>.99&&actual.heading>.99&&
      actual.cards.length===6&&actual.cards.every(a=>a.opacity>.99),actual);
    if(locale==="en"&&width===1440&&viaRouter)
      await page.screenshot({path:".superpowers/sdd/2026-11-15-motion-upgrade/contact-visible-fixed.png"});
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
