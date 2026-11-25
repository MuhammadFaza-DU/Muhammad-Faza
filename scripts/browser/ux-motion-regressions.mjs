globalThis.checkUXMotionRegressions = async page=>{
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.setViewportSize({width:1440,height:600});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  await page.waitForTimeout(1300);
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);
  await page.evaluate(()=>{
    const el=document.querySelector(".stats-list");
    window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight+2);
  });
  await page.waitForTimeout(1500);
  const edge=await page.locator(".stats-list").evaluate(el=>({
    running:el.getAnimations().filter(a=>a.playState==="running").length,opacity:+window.getComputedStyle(el).opacity
  }));
  check("edge reveal does not feed back into observer",edge.running===0&&edge.opacity===1,edge);
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(1200);
  await page.emulateMedia({reducedMotion:"reduce"});await page.waitForTimeout(100);
  const live=await page.locator("#intro-title").evaluate(el=>({
    opacity:+window.getComputedStyle(el).opacity,running:el.getAnimations().some(a=>a.playState==="running")
  }));
  check("live reduce leaves already read heading stable",live.opacity===1&&!live.running,live);
  const knob=await page.locator(".theme-switch-thumb").evaluate(el=>({
    properties:window.getComputedStyle(el).transitionProperty,duration:window.getComputedStyle(el).transitionDuration
  }));
  check("reduced knob has no transform interpolation",!knob.properties.includes("transform")||knob.duration==="0s",knob);
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  for(const selector of [".intro-portrait",".hiring-portrait",".featured-image"]){
    const overlays=await page.locator(selector).evaluateAll(elements=>elements.map(el=>({
      marker:el.hasAttribute("data-motion-enter")||el.hasAttribute("data-motion-scroll"),
      animations:el.getAnimations().map(a=>a instanceof window.CSSAnimation?a.animationName:"waapi")
    })));
    check(`own motion is not stacked: ${selector}`,overlays.every(el=>!el.marker&&!el.animations.includes("motion-entrance")&&!el.animations.includes("waapi")),overlays);
  }
  await page.waitForTimeout(1500);
  const popupPromise=page.context().waitForEvent("page");
  await page.locator(".gooey-nav__list").first().locator('a[href="/id/project/"]').click({modifiers:["Control"]});
  const popup=await popupPromise;await popup.close();
  await page.waitForTimeout(250);
  const current=await page.locator(".gooey-nav__list").first().locator("a[aria-current]").getAttribute("href");
  check("modified click keeps current-page nav highlight",current==="/id/",current);
  let release,requested;
  const pending=new Promise(resolve=>{requested=resolve;});
  await page.route("**/id/project/",async route=>{
    requested();
    await new Promise(resolve=>{release=resolve;});
    try{await route.continue();}catch{/* The superseded request is deliberately aborted. */}
  });
  await page.locator(".gooey-nav__list").first().locator('a[href="/id/project/"]').click({noWaitAfter:true});
  await pending;await page.waitForTimeout(300);
  await page.locator('.intro-actions a[href="/id/contact/"]').click({noWaitAfter:true});
  await page.waitForTimeout(250);
  release();
  await page.waitForTimeout(300);
  const aborted=await page.locator("main").evaluate(el=>+window.getComputedStyle(el).opacity);
  check("superseded route restores readable outgoing content",aborted===1,aborted);
  await page.unroute("**/id/project/");
  check("page errors clear",errors.length===0,errors);
  return {passed:results.every(result=>result.passed),results,errors};
}
