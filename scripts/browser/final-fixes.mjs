globalThis.checkFinalFixes = async page => {
  const results=[];
  const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator("[data-theme-toggle]").focus();
  await page.evaluate(()=>window.scrollTo(0,0));await frames();
  await page.locator(".stack-slot").nth(1).evaluate(el=>el.scrollIntoView({block:"start"}));
  await page.evaluate(()=>window.scrollBy(0,300));await frames();
  const before=await page.locator("#featured-gamein").boundingBox();
  await page.emulateMedia({reducedMotion:"reduce"});await frames();
  const after=await page.locator("#featured-gamein").boundingBox();
  results.push({caseId:"fixed-header-focus/reading-anchor",passed:Math.abs(before.y-after.y)<=2,actual:{before:before.y,after:after.y}});
  for(const face of ["front","back"]) {
    const context=await page.context().browser().newContext();
    const broken=await context.newPage();
    await broken.route(`**/media/lanyard/${face}.webp`,route=>route.abort());
    await broken.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    if(face==="back")await broken.locator(".lanyard-flip").click();
    await broken.waitForFunction(()=>document.querySelector(".lanyard-fallback img").complete);
    const actual=await broken.locator(".lanyard-fallback img").evaluate(el=>({src:el.getAttribute("src"),decoded:el.naturalWidth>0}));
    results.push({caseId:`failed-${face}/decoded-fallback`,passed:actual.decoded,actual});
    await context.close();
  }
  return {results,passed:results.every(item=>item.passed)};
}
