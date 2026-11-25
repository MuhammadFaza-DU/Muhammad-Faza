globalThis.checkHomeChoreography=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.mouse.move(0,0);
  await page.setViewportSize({width:1440,height:950});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.waitForSelector(".skill-showcase[data-enhanced]");
  const structure=await page.evaluate(()=>({
    stage:document.querySelector(".portrait-stage").hasAttribute("data-motion-scroll"),
    character:document.querySelector(".portrait-figure").dataset.motionScroll,
    orbit:document.querySelector(".tool-orbit").dataset.motionScroll,
    technology:document.querySelector(".skill-loop").dataset.motionScroll,
  }));
  check("skills/independent-reveal-owners",!structure.stage&&structure.character==="character"&&
    structure.orbit==="orbit"&&structure.technology==="technology",structure);
  await page.locator("#hire").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector(".faza-profile")?.dataset.profileIntroCount);
  const first=await page.locator(".faza-profile").evaluate(el=>({
    count:Number(el.dataset.profileIntroCount),active:el.style.getPropertyValue("--pc-active"),
    rotation:el.style.getPropertyValue("--pc-rotate-x"),box:el.getBoundingClientRect().toJSON(),
  }));
  check("profile/native-intro-starts-visible",first.count>=1&&Math.abs(parseFloat(first.rotation))>.1,first);
  await page.waitForTimeout(1700);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  await page.waitForTimeout(100);
  await page.locator("#hire").scrollIntoViewIfNeeded();
  await page.waitForFunction(count=>Number(document.querySelector(".faza-profile").dataset.profileIntroCount)>count,first.count);
  check("profile/native-intro-replays-on-reentry",true);
  const card=page.locator(".faza-profile");
  await page.waitForTimeout(1700);
  const box=await card.boundingBox();
  await page.mouse.move(box.x+box.width*.8,box.y+box.height*.3);
  await page.waitForTimeout(240);
  check("profile/pointer-holo-tilt-retained",await card.evaluate(el=>
    +el.style.getPropertyValue("--pc-active")>.2&&Math.abs(parseFloat(el.style.getPropertyValue("--pc-rotate-y")))>1));
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
