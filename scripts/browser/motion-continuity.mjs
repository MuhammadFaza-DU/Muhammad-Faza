globalThis.checkMotionContinuity=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:650});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
  const audit=await page.evaluate(async()=>{
    const anchor=document.querySelector(".portfolio-stats"),layer=document.querySelector(".stats-list");
    const samples=[];
    const sample=count=>new Promise(resolve=>{
      let n=0;const tick=()=>{
        samples.push({y:window.scrollY,opacity:+window.getComputedStyle(layer).opacity,
          top:anchor.getBoundingClientRect().top,transform:window.getComputedStyle(anchor).transform,
          phase:layer.dataset.revealState});
        if(++n<count)requestAnimationFrame(tick);else resolve();
      };requestAnimationFrame(tick);
    });
    const top=anchor.getBoundingClientRect().top+window.scrollY;
    window.scrollTo({top:top-window.innerHeight+70,behavior:"instant"});await sample(85);
    const readable=samples.at(-1).opacity;
    for(let i=0;i<12;i++){
      window.scrollBy({top:i%2?2:-2,behavior:"instant"});await sample(2);
    }
    const idle=samples.slice(-24);
    window.scrollTo({top:top+anchor.offsetHeight+100,behavior:"instant"});await sample(6);
    window.scrollTo({top:top-150,behavior:"instant"});await sample(15);
    const returning=samples.slice(-15);
    return {readable,idle,returning,all:samples.slice(0,6),
      direction:anchor.dataset.motionDirection,
      duration:layer.getAnimations().map(a=>a.effect.getTiming().duration)};
  });
  check("statistics/settles-without-edge-blink",audit.readable>.99&&audit.idle.every(f=>f.opacity>.99),audit);
  check("statistics/stable-measurement-anchor",audit.idle.every(f=>f.transform==="none"),audit.idle.slice(0,2));
  check("statistics/upward-reentry-is-perceptible",audit.direction==="up"&&audit.duration.some(d=>d>=900)&&
    audit.returning.some(f=>f.opacity>0&&f.opacity<.95),audit.returning);
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
