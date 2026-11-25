globalThis.checkCatalogResilience = async page => {
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/project/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("[data-catalog-card]")?.getAnimations().some(animation=>animation.playState==="running"));
  await page.evaluate(()=>window.scrollTo(0,2000));
  await page.waitForTimeout(550);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(35);
  const replay=await page.locator("[data-catalog-card]").first().evaluate(el=>({running:el.getAnimations().some(a=>a.playState==="running"),opacity:window.getComputedStyle(el).opacity}));
  check("scroll reveal rearms when first entrance finishes offscreen",replay.running,replay);
  await page.waitForTimeout(500);
  const old=await page.locator("[data-catalog-card]").first().boundingBox();
  await page.locator("[data-catalog-query]").fill("no-such-project-xyz");
  const ghost=await page.locator("[data-catalog-exit]").first().boundingBox();
  check("exit snapshot stays at old visual position when empty state appears",ghost&&Math.abs(ghost.y-old.y)<2,{old,ghost});
  await page.waitForTimeout(300);
  await page.locator("[data-catalog-reset]").click();
  await page.locator('[data-project-id="czip"] a').focus();
  await page.evaluate(()=>{
    const input=document.querySelector("[data-catalog-query]");
    input.value="Flutter";
    input.dispatchEvent(new window.Event("input",{bubbles:true}));
  });
  check("removing a focused result recovers input focus",await page.locator("[data-catalog-query]").evaluate(el=>el===document.activeElement),null);
  await page.locator("[data-catalog-reset]").click();
  await page.setViewportSize({width:768,height:600});
  await page.waitForTimeout(400);
  check("resize leaves visible results settled",await page.locator("[data-catalog-card]:not([hidden])").evaluateAll(cards=>cards.every(el=>window.getComputedStyle(el).opacity==="1"&&window.getComputedStyle(el).transform==="none")),null);
  const failure=await page.context().newPage();
  await failure.route("**/media/catalog/tazk-*",route=>route.abort());
  await failure.goto("http://127.0.0.1:4321/id/project/",{waitUntil:"networkidle"});
  const fallback=await failure.locator('[data-project-id="tazk"] .catalog-media-error').isVisible();
  const frame=await failure.locator('[data-project-id="tazk"] .catalog-media').boundingBox();
  check("image failure has honest text and reserved geometry",fallback&&Math.abs(frame.width/frame.height-1.6)<.01,{fallback,frame});
  await failure.close();
  for(const [locale,theme,width,height] of [["id","light",1440,1000],["en","dark",1440,1000],["id","light",390,844],["en","dark",390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(`http://127.0.0.1:4321/${locale}/project/`,{waitUntil:"networkidle"});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=height-100) {
      await page.evaluate(y=>window.scrollTo(0,y),y);
      await page.waitForTimeout(120);
    }
    await page.waitForFunction(()=>[...document.querySelectorAll(".catalog-media img")].every(img=>img.complete&&img.naturalWidth>0));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(650);
    const state=await page.locator(".catalog-list").evaluate(el=>({
      count:el.querySelectorAll("img").length,
      overflowing:[...el.querySelectorAll("h2")].filter(h=>h.scrollWidth>h.clientWidth+1).map(h=>h.textContent),
      outline:[...el.querySelectorAll("a")].every(a=>a.getAttribute("aria-labelledby")&&a.href),
    }));
    check(`${locale}/${theme}/${width} actual media decoded and titles intact`,state.count===11&&!state.overflowing.length&&state.outline,state);
    await page.screenshot({path:`.superpowers/sdd/2026-11-15-project-catalog/catalog-${locale}-${theme}-${width}.png`,fullPage:true});
  }
  check("resilience page errors clear",errors.length===0,errors);
  return {passed:results.every(item=>item.passed),results,errors};
}
