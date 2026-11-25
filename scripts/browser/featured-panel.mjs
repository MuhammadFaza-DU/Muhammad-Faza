globalThis.checkFeaturedPanel = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const width of [390,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const actual=await page.locator(".featured-info").evaluateAll(items=>items.map(el=>{
      const style=window.getComputedStyle(el),color=style.backgroundColor;
      const numbers=color.match(/[\d.]+/g)?.map(Number);
      const alpha=color.startsWith("color(")?Number(color.split("/")[1]?.replace(")","").trim()??1):numbers?.[3]??1;
      return {color,alpha,opacity:style.opacity,inside:el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1};
    }));
    results.push({caseId:`${width}/${theme}/solid-panel`,passed:actual.length===5&&actual.every(item=>item.alpha===1&&item.opacity==="1"&&item.inside),actual});
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
