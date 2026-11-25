globalThis.checkOpeningResilience=async page=>{
  const results=[],errors=[];
  const browser=page.context().browser();
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"no-preference"});
  const slow=await context.newPage();
  slow.on("pageerror",error=>errors.push(error.message));
  let release;
  const held=new Promise(resolve=>{release=resolve;});
  await slow.route("**/media/lanyard/strap.webp",async route=>{await held;await route.continue();});
  await slow.goto("http://127.0.0.1:4321/en/",{waitUntil:"domcontentloaded"});
  await slow.waitForFunction(()=>document.documentElement.dataset.openingSlow==="true",null,{timeout:12000});
  const waiting=await slow.evaluate(()=>({
    state:document.documentElement.dataset.opening,choice:document.documentElement.dataset.openingChoice,
    message:window.getComputedStyle(document.querySelector(".opening-slow")).display,
    hero:window.getComputedStyle(document.querySelector("#intro")).visibility,
    retryVisible:window.getComputedStyle(document.querySelector(".opening-failure")).display,
    locked:document.querySelector("main").inert,
  }));
  check("slow connection waits beyond 8s without dropping effects",waiting.state==="pending"&&!waiting.choice&&waiting.hero==="hidden",waiting);
  check("slow status is visible while content is inaccessible",waiting.message!=="none"&&waiting.locked,waiting);
  await slow.screenshot({path:".superpowers/sdd/2026-11-15-ux-motion/opening-slow.png"});
  release();
  await slow.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:15000});
  check("late real readiness still opens full Lanyard",await slow.locator(".lanyard-portrait").getAttribute("data-ready")==="true");
  await slow.unroute("**/media/lanyard/strap.webp");
  await slow.route("**/media/lanyard/strap.webp",route=>route.fulfill({status:404,body:"deliberate failure"}));
  await slow.reload({waitUntil:"domcontentloaded"});
  await slow.waitForFunction(()=>document.documentElement.dataset.opening==="failed",null,{timeout:12000});
  const failed=await slow.evaluate(()=>({
    state:document.documentElement.dataset.opening,choice:document.documentElement.dataset.openingChoice,
    retry:window.getComputedStyle(document.querySelector(".opening-failure")).display,
    hidden:window.getComputedStyle(document.querySelector("#intro")).visibility
  }));
  check("true asset failure offers retry without silent photo substitution",failed.state==="failed"&&!failed.choice&&failed.hidden==="hidden"&&failed.retry!=="none",failed);
  await slow.unroute("**/media/lanyard/strap.webp");
  await slow.locator("[data-opening-retry]").click();
  await slow.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:15000});
  check("retry recreates engine and opens experience",await slow.locator(".lanyard-portrait").getAttribute("data-ready")==="true");
  await context.close();
  const calmContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const calm=await calmContext.newPage();
  calm.on("pageerror",error=>errors.push(error.message));
  await calm.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  await calm.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:12000});
  check("existing reduced Lanyard mode opens with decoded image",await calm.locator(".lanyard-fallback img").evaluate(img=>img.complete&&img.naturalWidth>0));
  check("reduced mode does not mount moving Lanyard",await calm.locator(".lanyard-canvas").count()===0);
  check("phone opening does not overflow",await calm.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await calmContext.close();
  const plainContext=await browser.newContext({javaScriptEnabled:false});
  const plain=await plainContext.newPage();
  await plain.goto("http://127.0.0.1:4321/en/");
  check("no-JS never trapped behind loader",await plain.locator("#intro-title").isVisible()&&!await plain.locator(".opening-screen").isVisible());
  await plainContext.close();
  check("uncaught errors clear",errors.length===0,errors);
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
