globalThis.checkSkillFeedback=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1100});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
  await page.locator(".skill-loop").scrollIntoViewIfNeeded();
  await page.waitForSelector(".skill-showcase[data-enhanced]");
  await page.waitForTimeout(1300);
  await page.locator(".explanation-controls button").click();
  await page.waitForTimeout(40);
  check("list-control/press-and-entry",await page.locator(".explanation-controls button").evaluate(el=>el.getAnimations().length>0)&&
    await page.locator(".all-skills").evaluate(el=>el.getAnimations().length>0));
  await page.waitForTimeout(320);
  await page.locator('.all-skill-buttons button[data-skill-id="python"]').click();
  await page.waitForTimeout(30);
  const feedback=await page.locator('.all-skill-buttons button[data-skill-id="python"]').evaluate(el=>
    el.getAnimations().map(a=>({duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes()})));
  check("item/one-small-rebound",feedback.some(a=>a.duration<=280&&a.frames.some(f=>String(f.transform).includes("1.06"))),feedback);
  check("popup/anchored-entry",await page.locator("#skill-explanation").evaluate(el=>el.open&&
    el.getAnimations().some(a=>a.effect.getTiming().duration===240)));
  await page.keyboard.press("Escape");await page.waitForTimeout(300);
  await page.locator(".explanation-controls button").click();
  await page.waitForTimeout(35);
  check("list/closing-inert-animated",await page.locator(".all-skills").evaluate(el=>el.inert&&el.getAnimations().length>0));
  await page.waitForTimeout(250);
  const key=page.locator(".explanation-controls button");
  await key.focus();await page.keyboard.press("Enter");
  check("keyboard/list-immediate",await key.getAttribute("aria-expanded")==="true"&&
    await page.locator(".all-skills").evaluate(el=>!el.hidden&&!el.getAnimations().length));
  await page.setViewportSize({width:390,height:844});
  await page.locator('.all-skill-buttons button[data-skill-id="c"]').click();
  await page.waitForSelector('#skill-explanation[data-mode="modal"][open]');
  check("phone/modal-correct-description",await page.locator("#skill-explanation h3").innerText()==="C");
  await page.keyboard.press("Escape");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.locator('.all-skill-buttons button[data-skill-id="python"]').click();
  const calm=await page.locator("#skill-explanation").evaluate(el=>el.getAnimations().flatMap(a=>a.effect.getKeyframes()));
  check("reduced/activation-no-bounce",calm.every(f=>f.transform===undefined||f.transform==="none"),calm);
  await page.screenshot({path:".superpowers/sdd/2026-11-15-motion-upgrade/skills-phone.png"});
  await page.locator(".explanation-close").click();
  check("phone/close-without-extra-click",await page.locator(".skill-showcase").getAttribute("data-technology-paused")==="false");
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
