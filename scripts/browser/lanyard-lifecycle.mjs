globalThis.checkLanyardLifecycle = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.lanyardDrawCounts=new WeakMap();
    const original=window.WebGL2RenderingContext.prototype.drawElements;
    window.WebGL2RenderingContext.prototype.drawElements=function(...args){
      window.lanyardDrawCounts.set(this.canvas,(window.lanyardDrawCounts.get(this.canvas)||0)+1);
      return original.apply(this,args);
    };
  });
  const frames=()=>page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>++n===20?resolve():requestAnimationFrame(tick);tick();}));
  const check=(caseId,passed)=>results.push({caseId,passed});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
  await page.waitForFunction(()=>!["pending","failed","releasing"].includes(document.documentElement.dataset.opening));
  const canvas=page.locator(".lanyard-canvas");
  const hitCard=async()=>{
    await page.locator("#intro").scrollIntoViewIfNeeded();
    const box=await canvas.boundingBox();
    for(const fy of [.55,.5,.6,.45,.65,.4,.7,.35,.3,.75])
      for(const fx of [.5,.45,.55,.4,.6,.35,.65,.3,.7]) {
        const x=box.x+box.width*fx,y=box.y+box.height*fy;
        await page.mouse.move(x,y);
        if(await canvas.evaluate(el=>el.style.cursor==="grab"))return {x,y};
      }
    throw new Error("No visible card hit");
  };
  await frames();await frames();await frames();
  const cdp=await page.context().newCDPSession(page);
  const point=await hitCard();
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[point]});
  check("touch/actual-grab",await page.locator(".lanyard").getAttribute("data-dragging")==="true");
  await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:point.x+30,y:point.y+20}]});
  await cdp.send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]});
  check("touch/cancel-releases",await page.locator(".lanyard").getAttribute("data-dragging")==="false");
  await cdp.detach();
  const next=await hitCard();
  await page.mouse.move(next.x,next.y);await page.mouse.down();
  check("live-reduce/grab-first",await page.locator(".lanyard").getAttribute("data-dragging")==="true");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForSelector('.lanyard-portrait[data-reduced="true"]');
  check("live-reduce/disposed",await canvas.count()===0);
  await page.mouse.up();
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
  await page.evaluate(()=>{
    Object.defineProperty(document,"hidden",{configurable:true,value:true});
    document.dispatchEvent(new window.Event("visibilitychange"));
  });
  const before=await canvas.evaluate(el=>window.lanyardDrawCounts.get(el));
  await frames();
  check("synthetic-hidden/no-gpu-draw",await canvas.evaluate(el=>window.lanyardDrawCounts.get(el))===before);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new window.Event("visibilitychange"));});
  await frames();
  check("synthetic-visible/resume",await canvas.evaluate(el=>window.lanyardDrawCounts.get(el))>before);
  for(let i=0;i<3;i++) {
    await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
    await page.waitForURL("**/en/contact/");
    await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(0).click();
    await page.waitForURL("**/en/");
    await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
    check(`remount-${i}/one-canvas`,await canvas.count()===1);
  }
  await page.setViewportSize({width:390,height:800});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  await frames();
  check("200%-intro/no-overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
