globalThis.checkShowcase = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  const frames=()=>page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>++n===15?resolve():requestAnimationFrame(tick);tick();}));
  const sample=()=>page.evaluate(()=>({
    tool:document.querySelector(".orbit-tool")?.style.transform,
    tech:document.querySelector(".skill-loop-track")?.style.getPropertyValue("--travel-x"),
  }));
  const leave=async()=>{await page.mouse.move(0,200);await page.evaluate(()=>document.activeElement?.blur());await frames();};
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.waitForSelector('.skill-showcase[data-enhanced]');
  await leave();
  let a=await sample();await frames();let b=await sample();
  check("baseline/both-move",a.tool!==b.tool&&a.tech!==b.tech);
  await page.locator('.orbit-tool[data-depth="front"]').first().hover({force:true});
  a=await sample();await frames();b=await sample();
  check("hover-tool/only-tool-paused",a.tool===b.tool&&a.tech!==b.tech,{a,b});
  await leave();
  await page.locator(".skill-loop").hover();
  a=await sample();await frames();b=await sample();
  check("hover-tech/only-tech-paused",a.tech===b.tech&&a.tool!==b.tool,{a,b});
  await leave();
  await page.locator(".explanation-controls button").click();
  await leave();
  a=await sample();await frames();b=await sample();
  check("chooser/both-move",a.tech!==b.tech&&a.tool!==b.tool);
  check("chooser/enhanced-not-inert",await page.locator(".tool-orbit[inert],.skill-loop[inert]").count()===0);
  const chooser=page.locator(".all-skill-buttons button");
  check("chooser/25items",await chooser.count()===25,await chooser.count());
  for(let index=0;index<await chooser.count();index++) {
    const item=chooser.nth(index),name=await item.innerText(),group=await item.getAttribute("data-skill-group");
    await item.click();
    await page.waitForSelector("#skill-explanation[open]");
    await page.mouse.move(0,200);
    a=await sample();await frames();b=await sample();
    check(`item/${name}/correct-content`,await page.locator("#skill-explanation h3").innerText()===name);
    check(`item/${name}/list-keeps-both-moving`,a.tool!==b.tool&&a.tech!==b.tech,{a,b,group});
    await page.keyboard.press("Escape");
    await page.waitForSelector("#skill-explanation:not([open])",{state:"attached"});
  }
  await chooser.first().click();
  await page.waitForSelector('#skill-explanation[data-mode="anchored"][open]');
  await page.setViewportSize({width:390,height:844});
  await page.waitForSelector('#skill-explanation[data-mode="modal"][open]');
  check("resize/selection-retained",await page.locator("#skill-explanation h3").innerText()===await chooser.first().innerText());
  check("resize/one-dialog",await page.locator("#skill-explanation").count()===1);
  a=await sample();await frames();b=await sample();
  check("modal/list-keeps-both-moving",a.tool!==b.tool&&a.tech!==b.tech);
  await page.keyboard.press("Tab");
  check("modal/focus-trap",await page.evaluate(()=>document.querySelector("#skill-explanation").contains(document.activeElement)));
  await page.mouse.click(4,200);
  await page.waitForSelector("#skill-explanation:not([open])",{state:"attached"});
  check("modal/backdrop-dismiss",true);
  await page.locator('.all-skill-buttons button[data-skill-group="technology"]').first().click();
  await page.waitForSelector('#skill-explanation[open]');
  await page.locator(".explanation-close").click();
  await page.waitForSelector("#skill-explanation:not([open])",{state:"attached"});
  check("modal/cross-dismiss",true);
  await page.setViewportSize({width:1440,height:1000});
  await page.locator("#skills").scrollIntoViewIfNeeded();
  for(const index of [0,17]) {
    await page.locator('.skill-loop-group:not([aria-hidden]) button').nth(index).focus();
    const visible=await page.locator('.skill-loop-group:not([aria-hidden]) button').nth(index).evaluate(el=>{
      const box=el.getBoundingClientRect(),frame=el.closest(".skill-loop").getBoundingClientRect();
      return box.left>=frame.left&&box.right<=frame.right;
    });
    check(`keyboard/loop-${index}-visible`,visible);
  }
  await leave();
  await page.emulateMedia({reducedMotion:"reduce"});
  a=await sample();await frames();b=await sample();
  check("section2/reduce-exception",a.tool!==b.tool&&a.tech!==b.tech);
  check("section1/reduce-still-static",await page.locator(".lanyard-canvas").count()===0);
  await page.evaluate(()=>{
    Object.defineProperty(document,"hidden",{configurable:true,value:true});
    document.dispatchEvent(new window.Event("visibilitychange"));
  });
  await frames();a=await sample();await frames();b=await sample();
  check("synthetic-hidden/both-pause",a.tool===b.tool&&a.tech===b.tech);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new window.Event("visibilitychange"));});
  await frames();a=await sample();await frames();b=await sample();
  check("synthetic-visible/both-resume",a.tool!==b.tool&&a.tech!==b.tech);
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000});await frames();
    check(`${width}/no-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  }
  await page.locator(".all-skill-buttons button").first().click();
  await page.waitForSelector("#skill-explanation[open]");
  await page.mouse.click(4,200);
  await page.waitForSelector("#skill-explanation:not([open])",{state:"attached"});
  check("desktop/outside-dismiss",true);
  await page.screenshot({path:".superpowers/sdd/2026-11-14-home-revision-root/showcase-desktop.png",fullPage:true});
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
