globalThis.checkMotionFocusInterruption=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="releasing",null,{timeout:20000});
  const button=page.locator(".intro-actions a").first(),actions=page.locator(".intro-actions");
  await page.waitForFunction(()=>document.querySelector(".intro-actions").getAnimations().length>0);
  await actions.evaluate(async el=>{for(const a of el.getAnimations()){a.pause();await a.ready;a.currentTime=300;}});
  await page.evaluate(()=>{
    window.focusTrace=[];
    for(const type of ["pointerdown","focusin","pointerup","click"]){
      document.addEventListener(type,event=>window.focusTrace.push({type,target:event.target.className,
        focus:document.activeElement.className,
        animations:document.querySelector(".intro-actions").getAnimations().map(a=>({state:a.playState,time:a.currentTime})),
        y:document.querySelector(".intro-actions").getBoundingClientRect().y}),true);
    }
  });
  const before=await actions.boundingBox(),box=await button.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height-4);
  await page.mouse.down();
  const held=await actions.boundingBox();
  check("pointer-focus/does-not-remove-entrance-translation",Math.abs(held.y-before.y)<1,{before,held});
  await page.mouse.up();
  await page.waitForURL("**/en/project/",{timeout:4000}).catch(()=>{});
  check("pointer-focus/first-press-navigates",page.url().endsWith("/en/project/"),{
    url:page.url(),trace:await page.evaluate(()=>window.focusTrace)});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.locator(".skill-loop").waitFor();
  await page.waitForSelector(".skill-showcase[data-enhanced]");
  await page.waitForTimeout(1300);
  const toggle=page.locator(".explanation-controls button");
  await toggle.click();
  await page.locator(".all-skills").evaluate(el=>{for(const a of el.getAnimations()){a.currentTime=65;a.pause();}});
  const opacity=await page.locator(".all-skills").evaluate(el=>+window.getComputedStyle(el).opacity);
  await toggle.click();
  const reversed=await page.locator(".all-skills").evaluate(el=>+window.getComputedStyle(el).opacity);
  check("list-reversal/continues-from-live-opacity",Math.abs(opacity-reversed)<.16,{opacity,reversed});
  await page.waitForTimeout(250);
  check("list-reversal/closes-fully",await page.locator(".all-skills").isHidden());
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
