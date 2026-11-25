globalThis.checkDetailFailureText = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:320,height:900});
  await page.route("**/media/projects/gamein/featured-catalog-wide.webp",route=>route.abort());
  for(const locale of ["id","en"])for(const theme of ["light","dark"]) {
    await page.goto(`http://127.0.0.1:4321/${locale}/project/gamein/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("[data-detail-media-error]:not([hidden])").waitFor();
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    const actual=await page.locator("[data-detail-media-error]").evaluate(el=>{
      const frame=el.parentElement.getBoundingClientRect(),box=el.getBoundingClientRect();
      const range=document.createRange();range.selectNodeContents(el);
      const text=range.getBoundingClientRect();
      return {frame:frame.toJSON(),box:box.toJSON(),text:text.toJSON(),scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,
        clear:text.top>=frame.top&&text.bottom<=frame.bottom+1&&text.left>=frame.left&&text.right<=frame.right+1,
        overflow:document.documentElement.scrollWidth>window.innerWidth+1};
    });
    results.push({caseId:`${locale}/${theme}/320-200%-failure-message`,passed:actual.clear&&!actual.overflow&&actual.scrollHeight<=actual.clientHeight+1,actual});
    await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  }
  await page.unroute("**/media/projects/gamein/featured-catalog-wide.webp");
  return {passed:results.every(item=>item.passed)&&!errors.length,results,errors};
}
