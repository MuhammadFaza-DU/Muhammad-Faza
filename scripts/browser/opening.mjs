globalThis.checkOpening=async page=>{
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.addInitScript(()=>{
    window.openingFrames=[];
    const sample=()=>{
      const root=document.documentElement,hero=document.querySelector("#intro");
      if(hero){
        const state=root.dataset.opening;
        const fallback=hero.querySelector(".lanyard-fallback");
        window.openingFrames.push({
          state:state??"none",
          heroVisibility:window.getComputedStyle(hero).visibility,
          fallbackVisibility:fallback?window.getComputedStyle(fallback).visibility:"missing",
          ready:hero.querySelector(".lanyard-portrait")?.dataset.ready,
          headingAnimations:hero.querySelector("h1")?.getAnimations().map(a=>a.playState),
        });
      }
      if(window.openingFrames.length<500)requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  const started=await page.evaluate(()=>({state:document.documentElement.dataset.opening,loader:!!document.querySelector(".opening-screen")}));
  check("direct Home has a coordinated opening gate",started.loader&&!!started.state,started);
  if(!started.loader)return {results,errors,passed:false};
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",{},{timeout:20000});
  const frames=await page.evaluate(()=>window.openingFrames);
  check("no visible temporary photo during pending gate",frames.filter(f=>f.state==="pending"||f.state==="failed").every(f=>f.heroVisibility==="hidden"),frames.slice(0,8));
  check("hero does not appear until textured engine ready",frames.filter(f=>f.state==="releasing").every(f=>f.ready==="true"),frames.filter(f=>f.state==="releasing").slice(0,3));
  check("loader clears accessibility lock",await page.locator("main").evaluate(el=>!el.inert));
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:12000});
  check("refresh at restored scroll cannot strand opening offscreen",await page.locator(".lanyard-portrait").getAttribute("data-ready")==="true");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/id/contact/"]').click();
  await page.waitForURL("**/id/contact/");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/id/"]').click();
  await page.waitForURL("**/id/");
  check("internal Home navigation has no full loader",await page.locator(".opening-screen").evaluate(el=>window.getComputedStyle(el).display==="none"));
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.waitForSelector(".skill-showcase[data-enhanced]");
  check("portrait and orbit share scroll target",await page.locator(".portrait-stage").evaluate(el=>el.hasAttribute("data-motion-scroll")&&!!el.querySelector(".tool-orbit")&&!!el.querySelector(".portrait-figure")));
  check("skill loop has separate scroll target",await page.locator(".skill-loop").evaluate(el=>el.hasAttribute("data-motion-scroll")));
  for(const selector of [".intro-portrait",".hiring-portrait",".featured-image"]){
    check(`no stacked card reveal ${selector}`,await page.locator(selector).evaluateAll(els=>els.length>0&&els.every(el=>!el.hasAttribute("data-motion-enter")&&!el.hasAttribute("data-motion-scroll"))));
  }
  check("console clear",errors.length===0,errors);
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
