globalThis.checkOpeningRecovery=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const context=await page.context().browser().newContext({viewport:{width:1440,height:1000}});
  const target=await context.newPage();
  target.on("pageerror",error=>errors.push(error.message));
  let failedModule=true;
  await target.route("**/_astro/LanyardPortrait.*",route=>failedModule?route.abort("failed"):route.continue());
  await target.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  await target.waitForFunction(()=>document.documentElement.dataset.opening==="failed",null,{timeout:12000});
  const failure=await target.evaluate(()=>({
    state:document.documentElement.dataset.opening,reload:document.documentElement.dataset.openingReload,
    retry:window.getComputedStyle(document.querySelector(".opening-failure")).display,
  }));
  check("island import failure cannot leave endless unexplained spinner",failure.state==="failed"&&failure.retry!=="none"&&failure.reload==="true",failure);
  failedModule=false;
  await target.locator("[data-opening-retry]").click();
  await target.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:15000});
  check("module retry reloads real resources",await target.locator(".lanyard-portrait").getAttribute("data-ready")==="true");
  await context.close();
  const liveContext=await page.context().browser().newContext({viewport:{width:1440,height:1000}});
  const live=await liveContext.newPage();
  let release;
  const held=new Promise(resolve=>{release=resolve;});
  await live.route("**/media/lanyard/strap.webp",async route=>{await held;await route.continue().catch(()=>{});});
  await live.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  await live.waitForSelector(".lanyard",{state:"attached"});
  await live.emulateMedia({reducedMotion:"reduce"});
  await live.emulateMedia({reducedMotion:"no-preference"});
  release();
  await live.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:15000});
  check("rapid live reduce toggles do not turn teardown into terminal failure",await live.locator(".lanyard-portrait").getAttribute("data-ready")==="true");
  await liveContext.close();
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
