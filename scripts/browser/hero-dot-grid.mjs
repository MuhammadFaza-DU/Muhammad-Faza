globalThis.checkHeroDotGrid = async page => {
  const results=[],errors=[],warnings=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(["error","warning"].includes(message.type()))warnings.push(message.text());});
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  await page.addInitScript(()=>{
    window.dotDraws=new WeakMap();
    window.dotUniformNames=new WeakMap();window.dotBaseColors=new WeakMap();
    const getUniform=window.WebGL2RenderingContext.prototype.getUniformLocation;
    window.WebGL2RenderingContext.prototype.getUniformLocation=function(program,name){
      const location=getUniform.call(this,program,name);
      if(location)window.dotUniformNames.set(location,name);
      return location;
    };
    const uniform=window.WebGL2RenderingContext.prototype.uniform3f;
    window.WebGL2RenderingContext.prototype.uniform3f=function(location,...values){
      if(window.dotUniformNames.get(location)==="uBase")window.dotBaseColors.set(this.canvas,values);
      return uniform.call(this,location,...values);
    };
    const original=window.WebGL2RenderingContext.prototype.drawArraysInstanced;
    window.WebGL2RenderingContext.prototype.drawArraysInstanced=function(...args){
      window.dotDraws.set(this.canvas,(window.dotDraws.get(this.canvas)||0)+1);
      return original.apply(this,args);
    };
  });
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  const canvas=page.locator(".hero-dot-grid canvas");
  if(!await canvas.count())return {results:[{caseId:"hero/one-dotgrid",passed:false}],errors,warnings,passed:false};
  await page.waitForSelector('.hero-dot-grid canvas[data-ready="true"]');
  await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
  check("hero/one-dotgrid",await canvas.count()===1);
  check("hero/decorative-pointer-transparent",await page.locator(".hero-dot-grid").evaluate(el=>el.getAttribute("aria-hidden")==="true"&&window.getComputedStyle(el).pointerEvents==="none"));
  const first=await canvas.evaluate(el=>window.dotDraws.get(el));
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+20,box.y+20);
  await page.mouse.move(box.x+80,box.y+120,{steps:6});
  await page.waitForFunction(start=>window.dotDraws.get(document.querySelector(".hero-dot-grid canvas"))>start,first);
  check("pointer/real-gpu-response",true);
  await page.mouse.click(box.x+20,box.y+40);
  await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
  check("shock/settles-to-idle",true);
  await page.locator("[data-theme-toggle]").click();
  await page.waitForFunction(()=>Math.abs((window.dotBaseColors.get(document.querySelector(".hero-dot-grid canvas"))?.[0]??0)-65/255)<.001);
  check("theme/live-dark-palette",true);
  const supportsLoss=await canvas.evaluate(el=>{
    const extension=el.getContext("webgl2").getExtension("WEBGL_lose_context");
    if(!extension)return false;
    window.dotRestore=extension;extension.loseContext();return true;
  });
  if(supportsLoss) {
    await page.waitForSelector('.hero-dot-grid canvas[data-ready="false"]');
    check("context-loss/static-fallback",await page.locator(".hero-dot-grid").evaluate(el=>Number(window.getComputedStyle(el,"::before").opacity)>0));
    await page.evaluate(()=>window.dotRestore.restoreContext());
    await page.waitForSelector('.hero-dot-grid canvas[data-ready="true"]');
    await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
    check("context-restoration/ready",true);
  } else check("context-restoration/available",false);
  await page.locator("#hire").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
  const offscreen=await canvas.evaluate(el=>window.dotDraws.get(el));
  await page.evaluate(()=>new Promise(resolve=>{let i=0;const tick=()=>++i===20?resolve():requestAnimationFrame(tick);requestAnimationFrame(tick);}));
  check("offscreen/no-gpu-frames",await canvas.evaluate(el=>window.dotDraws.get(el))===offscreen);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
  const reduced=await canvas.evaluate(el=>window.dotDraws.get(el));
  await page.mouse.move(box.x+100,box.y+100,{steps:6});
  await page.evaluate(()=>new Promise(resolve=>{let i=0;const tick=()=>++i===20?resolve():requestAnimationFrame(tick);requestAnimationFrame(tick);}));
  const afterReduced=await canvas.evaluate(el=>window.dotDraws.get(el));
  check("live-reduce/static",afterReduced===reduced,{before:reduced,after:afterReduced});
  await page.emulateMedia({reducedMotion:"no-preference"});
  const browser=page.context().browser();
  const noGpu=await browser.newContext();
  const fallback=await noGpu.newPage();
  await fallback.addInitScript(()=>{
    const original=window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext=function(kind,...args){
      return kind==="webgl2"?null:original.call(this,kind,...args);
    };
  });
  await fallback.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  check("no-webgl/static-fallback",await fallback.locator(".hero-dot-grid").evaluate(el=>window.getComputedStyle(el,"::before").backgroundImage.includes("radial-gradient")));
  await noGpu.close();
  const noJs=await browser.newContext({javaScriptEnabled:false});
  const plain=await noJs.newPage();
  await plain.goto("http://127.0.0.1:4321/en/");
  check("no-js/static-grid",await plain.locator(".hero-dot-grid canvas").count()===0&&await plain.locator(".hero-dot-grid").evaluate(el=>window.getComputedStyle(el,"::before").backgroundImage.includes("radial-gradient")));
  await noJs.close();
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
  await page.waitForURL("**/en/contact/");
  check("router/contact-no-dotgrid",await page.locator(".hero-dot-grid").count()===0);
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').first().click();
  await page.waitForURL("**/en/");
  await page.waitForSelector('.hero-dot-grid canvas[data-ready="true"]');
  check("router/remount-one-dotgrid",await page.locator(".hero-dot-grid canvas").count()===1);
  return {results,errors,warnings,passed:results.every(r=>r.passed)&&!errors.length&&!warnings.length};
}
