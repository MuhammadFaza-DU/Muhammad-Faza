globalThis.checkUXMotion = async page => {
  const results=[],errors=[],warnings=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{
    if(message.type()==="error")errors.push(message.text());
    if(message.type()==="warning")warnings.push(message.text());
  });
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>!["pending","failed"].includes(document.documentElement.dataset.opening));
  const initial=await page.locator("#intro-title").evaluate(el=>{
    const s=window.getComputedStyle(el);return {name:s.animationName,duration:parseFloat(s.animationDuration),filter:s.filter};
  });
  check("initial load has perceptible entrance",initial.name!=="none"&&initial.duration>=.6,initial);
  await page.waitForTimeout(1100);
  await page.setViewportSize({width:1440,height:600});
  await page.waitForTimeout(250);
  const target=page.locator(".stats-list");
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(150);
  await page.evaluate(()=>{
    const el=document.querySelector(".stats-list");
    window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight+2);
  });
  await page.waitForTimeout(1400);
  const edge=await target.evaluate(el=>({active:el.getAnimations().filter(a=>a.playState==="running").length,opacity:+window.getComputedStyle(el).opacity}));
  check("edge reveal settles instead of retriggering itself",edge.active===0&&edge.opacity===1,edge);
  await page.locator(".portfolio-stats").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(200);
  await page.evaluate(()=>{
    const el=document.querySelector(".stats-list");
    window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight+180);
  });
  await page.waitForTimeout(100);
  const down=await target.evaluate(el=>({
    direction:el.getAttribute("data-motion-direction"),
    animations:el.getAnimations().map(a=>({duration:a.effect?.getTiming().duration,frames:a.effect?.getKeyframes()}))
  }));
  check("downward scroll has visible replay",down.direction==="down"&&down.animations.some(a=>a.duration>=600),down);
  await page.waitForTimeout(1000);
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{
    const el=document.querySelector(".stats-list");
    window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-200);
  });
  await page.waitForTimeout(100);
  const up=await target.evaluate(el=>({
    direction:el.getAttribute("data-motion-direction"),filter:window.getComputedStyle(el).filter,
    animations:el.getAnimations().map(a=>a.effect?.getKeyframes())
  }));
  check("upward scroll uses blur-to-clear",up.direction==="up"&&up.animations.some(frames=>frames?.some(frame=>String(frame.filter).includes("blur("))),up);
  await page.waitForTimeout(1000);
  const armor=page.locator(".showcase-toolbar button");
  await armor.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>!document.querySelector(".showcase-toolbar button")?.disabled);
  await armor.click();
  await page.waitForTimeout(180);
  const armorOpacity=await page.locator(".portrait-armor-whole").evaluateAll(els=>els.length?+window.getComputedStyle(els[0]).opacity:null);
  check("explicit armor toggle has intermediate crossfade",armorOpacity>0&&armorOpacity<1,armorOpacity);
  await armor.click();
  await page.waitForTimeout(700);
  check("armor reversal settles",await page.locator(".portrait-armor-whole").evaluateAll(els=>els.length&&+window.getComputedStyle(els[0]).opacity<.001));
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"domcontentloaded"});
  const calm=await page.locator("#intro-title").evaluate(el=>{
    const s=window.getComputedStyle(el);return {name:s.animationName,duration:parseFloat(s.animationDuration),transform:s.transform,filter:s.filter};
  });
  check("reduced still has perceptible fade",calm.name!=="none"&&calm.duration>=.3,calm);
  check("reduced entrance does not blur or translate",calm.transform==="none"&&calm.filter==="none",calm);
  await page.waitForTimeout(900);
  await page.locator('.intro-actions a[href="/en/project/"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/en/project/");
  check("keyboard CTA works during reduced mode",await page.locator("[data-catalog-card]").count()===11);
  check("no animation overlay intercepts interaction",await page.locator(".motion-bridge").evaluateAll(els=>els.every(el=>window.getComputedStyle(el).pointerEvents==="none")));
  check("console clean",errors.length===0&&warnings.length===0,{errors,warnings});
  return {passed:results.every(result=>result.passed),results,errors,warnings};
}
