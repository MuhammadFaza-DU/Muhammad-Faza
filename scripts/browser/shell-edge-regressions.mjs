globalThis.checkShellEdges = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:140});
  await page.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
  await page.locator("[data-language-toggle]").click();
  const bounds=await page.locator(".language-options").evaluate(el=>({
    bottom:el.getBoundingClientRect().bottom,height:el.getBoundingClientRect().height,
    viewport:window.innerHeight,overflow:window.getComputedStyle(el).overflowY,
  }));
  results.push({caseId:"short-desktop/language-picker-contained",passed:bounds.bottom<=bounds.viewport&&bounds.height>=44,actual:bounds});
  await page.locator("[data-language-toggle]").focus();await page.keyboard.press("End");
  const last=await page.locator(".language-options a").last().boundingBox();
  results.push({caseId:"short-desktop/last-option-reachable",passed:last.y>=0&&last.y+last.height<=140,actual:last});
  for(const [width,mode] of [[1440,"nav-only"],[390,"scrolling-nav"]]) {
    await page.setViewportSize({width,height:220});
    await page.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    await page.waitForFunction(()=>document.querySelector(".site-header").dataset.mode!=="normal");
    await page.evaluate(()=>window.scrollTo(0,400));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const actual=await page.locator(".header-nav").evaluate(el=>({
      mode:document.querySelector(".site-header").dataset.mode,top:el.getBoundingClientRect().top,
      scroll:window.scrollY,blur:window.getComputedStyle(el).backdropFilter,
    }));
    results.push({caseId:`${mode}/nav-stays-fixed`,passed:actual.mode===mode&&Math.abs(actual.top)<=1&&actual.scroll>=300&&actual.blur.includes("blur"),actual});
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
