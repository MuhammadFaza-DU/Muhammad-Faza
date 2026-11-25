globalThis.checkWorkTitleMotion=async page=>{
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  await page.waitForFunction(()=>!["pending","failed","releasing"].includes(document.documentElement.dataset.opening),null,{timeout:20000});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(1100);
  await page.evaluate(()=>{
    const heading=document.querySelector("#work-title");
    window.scrollTo(0,heading.getBoundingClientRect().top+window.scrollY-window.innerHeight+120);
  });
  await page.waitForTimeout(120);
  const moving=await page.locator("#work-title").evaluate(el=>({
    direction:el.dataset.motionDirection,
    animations:el.getAnimations().map(a=>({duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes()})),
    sticky:window.getComputedStyle(el.parentElement).position,
  }));
  check("work title retains scroll entrance",moving.direction==="down"&&moving.animations.some(a=>a.duration>=600),moving);
  check("title sticky positioning retained",moving.sticky==="sticky",moving.sticky);
  await page.waitForTimeout(1000);
  check("work title settles readable",await page.locator("#work-title").evaluate(el=>+window.getComputedStyle(el).opacity===1&&window.getComputedStyle(el).transform==="none"));
  check("stack media has no extra entrance",await page.locator(".featured-image").evaluateAll(els=>els.every(el=>!el.hasAttribute("data-motion-scroll"))));
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
