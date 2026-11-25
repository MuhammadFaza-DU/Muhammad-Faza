globalThis.checkLanyard = async page => {
  const origin="http://127.0.0.1:4321",results=[],errors=[],warnings=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(["warning","error"].includes(message.type()))warnings.push(message.text());});
  await page.addInitScript(()=>{
    window.lanyardDrawCounts=new WeakMap();
    for(const key of ["drawElements","drawArrays"]) {
      const original=window.WebGL2RenderingContext.prototype[key];
      window.WebGL2RenderingContext.prototype[key]=function(...args) {
        window.lanyardDrawCounts.set(this.canvas,(window.lanyardDrawCounts.get(this.canvas)||0)+1);
        return original.apply(this,args);
      };
    }
  });
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  const frames=async(count=20)=>page.evaluate(count=>new Promise(resolve=>{
    let n=0; const tick=()=>++n>=count?resolve():requestAnimationFrame(tick);requestAnimationFrame(tick);
  }),count);
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/en/`,{waitUntil:"networkidle"});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:15000});
  await frames(100);
  check("normal/textured-visible",await page.locator(".lanyard-canvas").isVisible());
  await page.screenshot({path:".superpowers/sdd/2026-11-14-home-revision-root/lanyard-desktop-light.png"});
  const first=await page.locator(".lanyard-canvas").screenshot();
  await frames(30);
  check("normal/sway",!first.equals(await page.locator(".lanyard-canvas").screenshot()));
  await page.locator(".lanyard-flip").focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector('.lanyard-portrait[data-face="back"]');
  await frames(80);
  check("keyboard/flip",await page.locator(".lanyard-flip").getAttribute("aria-pressed")==="true");
  await page.screenshot({path:".superpowers/sdd/2026-11-14-home-revision-root/lanyard-back.png"});
  await page.locator(".lanyard-flip").press("Enter");
  await frames(80);
  const canvas=page.locator(".lanyard-canvas"),box=await canvas.boundingBox();
  let hit=null;
  for(let y=box.y+box.height*.28;y<box.y+box.height*.8&&!hit;y+=24)
    for(let x=box.x+box.width*.25;x<box.x+box.width*.75;x+=24) {
      await page.mouse.move(x,y);
      if(await canvas.evaluate(el=>el.style.cursor==="grab")) {hit={x,y};break;}
    }
  check("pointer/card-hit",!!hit,hit);
  if(hit) {
    await page.mouse.move(hit.x,hit.y);await page.mouse.down();
    check("pointer/grab",await page.locator(".lanyard").getAttribute("data-dragging")==="true");
    await page.mouse.move(hit.x+60,hit.y+55,{steps:10});
    await page.mouse.up();
    check("pointer/release",await page.locator(".lanyard").getAttribute("data-dragging")==="false");
    await page.mouse.move(hit.x,hit.y);await page.mouse.down();
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.waitForSelector('.lanyard-portrait[data-reduced="true"]');
    check("live-reduce/no-canvas",await canvas.count()===0);
    await page.mouse.up();
    await page.locator(".lanyard-flip").click();
    check("reduced/instant-native-flip",await page.locator(".lanyard-portrait").getAttribute("data-face")==="back");
  }
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
  const lostCanvas=await canvas.elementHandle();
  await canvas.evaluate(el=>{
    const gl=el.getContext("webgl2");window.lanyardLoss=gl.getExtension("WEBGL_lose_context");window.lanyardLoss.loseContext();
  });
  await page.waitForSelector('.lanyard-portrait[data-ready="false"]');
  check("context-loss/real-photo",await page.locator(".lanyard-fallback").isVisible());
  await page.evaluate(()=>window.lanyardLoss.restoreContext());
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:15000});
  check("context-restored/recreated",!await canvas.evaluate((el,old)=>el===old,lostCanvas));
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
  await page.waitForURL("**/en/contact/");
  check("route/engine-removed",await canvas.count()===0);
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(0).click();
  await page.waitForURL("**/en/");
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:15000});
  check("route/home-remounted",await canvas.count()===1);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:950});
    await frames(10);
    check(`${width}/no-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    check(`${width}/justified`,await page.locator(".intro-description p").evaluateAll(items=>items.every(item=>window.getComputedStyle(item).textAlign==="justify")));
    if(width===390)await page.screenshot({path:".superpowers/sdd/2026-11-14-home-revision-root/lanyard-phone.png",fullPage:true});
  }
  await page.locator("#hire").scrollIntoViewIfNeeded();
  await page.waitForSelector(".profile-card");
  check("hiring/exact-cutout",await page.locator(".profile-card__photo").getAttribute("src")==="/media/portrait/normal-768.webp");
  await frames(5);
  const draws=await canvas.evaluate(el=>window.lanyardDrawCounts.get(el));
  await frames(30);
  check("offscreen/suspended-gpu",await canvas.evaluate(el=>window.lanyardDrawCounts.get(el))===draws);
  await page.locator("#intro").scrollIntoViewIfNeeded();
  await frames(15);
  check("onscreen/resumed-gpu",await canvas.evaluate(el=>window.lanyardDrawCounts.get(el))>draws);
  for(const theme of ["dark","light"]) {
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("#hire").scrollIntoViewIfNeeded();
    await page.screenshot({path:`.superpowers/sdd/2026-11-14-home-revision-root/hiring-${theme}.png`});
    check(`${theme}/alpha-foil`,await page.locator(".profile-card__holo").count()===1);
  }
  const browser=page.context().browser();
  for(const mode of ["no-js","no-gpu","failed-texture","reduced"]) {
    const context=await browser.newContext({javaScriptEnabled:mode!=="no-js",reducedMotion:mode==="reduced"?"reduce":"no-preference"});
    const fallback=await context.newPage();
    if(mode==="no-gpu")await fallback.addInitScript(()=>{
      const original=window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith("webgl")?null:original.call(this,type,...args);};
    });
    if(mode==="failed-texture")await fallback.route("**/media/lanyard/back.webp",route=>route.abort());
    await fallback.goto(`${origin}/id/`,{waitUntil:"networkidle"});
    check(`${mode}/visible-html-photo`,await fallback.locator(".lanyard-fallback img").isVisible());
    if(mode!=="no-js") {
      await fallback.locator(".lanyard-flip").click();
      check(`${mode}/native-flip`,await fallback.locator(".lanyard-portrait").getAttribute("data-face")==="back");
      await fallback.waitForFunction(()=>document.querySelector(".lanyard-fallback img").complete);
      check(`${mode}/flip-retains-real-image`,await fallback.locator(".lanyard-fallback img").evaluate(el=>el.naturalWidth>0));
    }
    await context.close();
  }
  return {results,errors,warnings,passed:results.every(result=>result.passed)&&!errors.length&&!warnings.length};
}
