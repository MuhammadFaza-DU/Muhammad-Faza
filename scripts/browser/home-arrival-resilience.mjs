globalThis.checkHomeArrivalResilience=async page=>{
  const results=[],errors=[],browser=page.context().browser();
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const tab=await context.newPage();
  tab.on("pageerror",error=>errors.push(error.message));
  let release;
  const held=new Promise(resolve=>{release=resolve;});
  await tab.route("**/media/lanyard/strap.webp",async route=>{
    await held;
    try{await route.continue();}
    catch(error){if(!String(error).includes("Route is already handled"))throw error;}
  });
  await tab.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
  await tab.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/"]').click();
  await tab.waitForFunction(()=>document.documentElement.dataset.homeEntrySlow==="true",null,{timeout:12000});
  const slow=await tab.evaluate(()=>({
    state:document.documentElement.dataset.homeEntry,opening:document.documentElement.dataset.opening,
    hero:window.getComputedStyle(document.querySelector("#intro")).visibility,
    status:window.getComputedStyle(document.querySelector(".opening-slow")).display,
    mark:window.getComputedStyle(document.querySelector(".opening-mark")).display,
    header:document.querySelector(".site-header").inert,
  }));
  check("internal-slow/waits-without-photo-or-MF",slow.state==="pending"&&!slow.opening&&
    slow.hero==="hidden"&&slow.status!=="none"&&slow.mark==="none"&&!slow.header,slow);
  await tab.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/project/"]').click();
  await tab.waitForURL("**/en/project/");
  release();await tab.unroute("**/media/lanyard/strap.webp");
  await tab.waitForTimeout(500);
  check("leave-pending/route-remains-unlocked",await tab.evaluate(()=>!document.querySelector("main").inert&&
    !document.documentElement.dataset.homeEntry&&document.querySelectorAll(".lanyard-canvas").length===0));
  await tab.route("**/media/lanyard/strap.webp",route=>route.fulfill({status:404,body:"deliberate failure"}));
  await tab.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/"]').click();
  await tab.waitForFunction(()=>document.documentElement.dataset.homeEntry==="failed",null,{timeout:15000});
  check("internal-failure/retry-without-MF-or-fallback",await tab.locator(".opening-failure").isVisible()&&
    !await tab.locator(".opening-mark").isVisible()&&!await tab.locator("#intro").isVisible());
  await tab.unroute("**/media/lanyard/strap.webp");
  await tab.locator("[data-opening-retry]").click();
  await tab.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:15000});
  check("internal-retry/full-engine-restored",await tab.locator('.lanyard-portrait[data-ready="true"]').count()===1);
  await tab.locator("#hire").scrollIntoViewIfNeeded();
  await tab.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/contact/"]').click();
  await tab.waitForURL("**/en/contact/");
  await tab.goBack();await tab.waitForURL("**/en/");
  await tab.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:15000});
  check("offscreen-history/gate-releases-without-forcing-scroll",await tab.evaluate(()=>
    window.scrollY>window.innerHeight&&document.querySelector(".lanyard-portrait").dataset.ready==="true"&&!document.querySelector("#intro").inert));
  await tab.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await tab.locator('.intro-actions a[href="/en/project/"]').click();
  await tab.waitForURL("**/en/project/");
  check("work-CTA/real-navigation",await tab.locator("[data-catalog-card]").count()===11);
  await tab.goBack();await tab.waitForURL("**/en/");
  await tab.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:15000});
  const feedback=[];
  for(const selector of [".intro-actions .button-secondary",".hiring-projects"]){
    const button=tab.locator(selector);await button.scrollIntoViewIfNeeded();await tab.waitForTimeout(750);
    const box=await button.boundingBox();
    await tab.mouse.move(box.x+box.width/2,box.y+box.height/2);await tab.mouse.down();
    await tab.waitForTimeout(130);
    feedback.push(await button.evaluate(el=>({
      scale:Number(window.getComputedStyle(el).scale),frames:el.getAnimations().flatMap(a=>a.effect?.getKeyframes()??[]).map(f=>f.scale),
    })));
    await tab.mouse.move(2,400);await tab.mouse.up();await tab.waitForTimeout(250);
  }
  check("secondary-buttons/press-feedback-matches",feedback.every(f=>f.scale<.99&&f.scale>.96)&&
    Math.abs(feedback[0].scale-feedback[1].scale)<.005,feedback);
  await tab.locator(".hiring-projects").click();await tab.waitForURL("**/en/project/");
  check("hiring-CTA/real-navigation",await tab.locator("[data-catalog-card]").count()===11);
  await context.close();
  const calmContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const calm=await calmContext.newPage();
  calm.on("pageerror",error=>errors.push(error.message));
  await calm.goto("http://127.0.0.1:4321/id/contact/",{waitUntil:"networkidle"});
  await calm.locator('.gooey-nav__list:not([aria-hidden]) a[href="/id/"]').click();
  await calm.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:12000});
  check("reduced-phone/decoded-static-mode-not-MF",await calm.locator(".lanyard-canvas").count()===0&&
    await calm.locator(".lanyard-fallback img").evaluate(img=>img.complete&&img.naturalWidth>0)&&
    !await calm.locator(".opening-screen").isVisible());
  check("reduced-phone/no-blur-or-overflow",await calm.locator("#intro").evaluate(el=>
    window.getComputedStyle(el).filter==="none"&&document.documentElement.scrollWidth<=window.innerWidth+1));
  await calm.screenshot({path:".superpowers/sdd/2026-11-15-home-followup/home-phone.png"});
  await calm.locator(".intro-actions a").first().focus();await calm.keyboard.press("Enter");
  await calm.waitForURL("**/id/project/");
  check("reduced-keyboard/CTA-goes-to-catalog",await calm.locator("[data-catalog-card]").count()===11);
  await calmContext.close();
  const plainContext=await browser.newContext({javaScriptEnabled:false});
  const plain=await plainContext.newPage();
  await plain.goto("http://127.0.0.1:4321/en/");
  check("noJS/content-not-gated-and-catalog-link-real",await plain.locator("#intro-title").isVisible()&&
    !await plain.locator(".opening-screen").isVisible()&&await plain.locator(".intro-actions a").first().getAttribute("href")==="/en/project/");
  await plainContext.close();
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
