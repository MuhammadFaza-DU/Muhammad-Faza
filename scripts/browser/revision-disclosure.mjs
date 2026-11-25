globalThis.checkRevisionDisclosure=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:"no-preference"});
    await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    await page.locator(".skill-showcase").scrollIntoViewIfNeeded();
    const button=page.locator('[aria-controls="all-skills"]');
    await button.waitFor();
    const sample=async()=>{
      await button.click();
      return page.evaluate(()=>new Promise(resolve=>{
        const rows=[],start=window.performance.now();
        const tick=()=>{
          const el=document.querySelector("#all-skills"),box=el.getBoundingClientRect();
          rows.push({height:box.height,neighbor:document.querySelector("#work").getBoundingClientRect().top});
          if(window.performance.now()-start<350)requestAnimationFrame(tick);else resolve(rows);
        };tick();
      }));
    };
    const opening=await sample(),height=Math.max(...opening.map(r=>r.height));
    check(`${width}/open-height-interpolates`,opening.some(r=>r.height>1&&r.height<height-2),opening);
    const closing=await sample();
    check(`${width}/close-height-interpolates`,closing.some(r=>r.height>1&&r.height<height-2),closing);
    check(`${width}/closed-no-space`,await page.locator("#all-skills").evaluate(el=>el.hidden&&el.getBoundingClientRect().height===0));
    await button.click();await page.waitForTimeout(50);await button.click();await page.waitForTimeout(50);await button.click();
    await page.waitForTimeout(350);
    check(`${width}/rapid-reversal-open`,await button.getAttribute("aria-expanded")==="true"&&await page.locator("#all-skills").evaluate(el=>!el.hidden&&!el.inert&&el.clientHeight>=el.scrollHeight-2));
    await page.setViewportSize({width:width===390?768:1024,height:1000});
    check(`${width}/resize-natural-height`,await page.locator("#all-skills").evaluate(el=>el.clientHeight>=el.scrollHeight-2&&!el.style.height));
    await button.focus();await page.keyboard.press("Enter");
    check(`${width}/keyboard-close-direct`,await page.locator("#all-skills").evaluate(el=>el.hidden)&&await button.evaluate(el=>document.activeElement===el));
    await page.keyboard.press("Enter");
    check(`${width}/keyboard-open-direct`,await page.locator("#all-skills").evaluate(el=>!el.hidden&&!el.inert&&el.style.height===""));
    await page.emulateMedia({reducedMotion:"reduce"});await button.click();
    check(`${width}/reduced-close-direct`,await page.locator("#all-skills").evaluate(el=>el.hidden));
  }
  const plainContext=await page.context().browser().newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const plain=await plainContext.newPage();await plain.goto("http://127.0.0.1:4321/en/");
    await plain.locator(".static-skill-list summary").click();
    check("noJS-static-tools-remain-available",await plain.locator(".static-skill-list").isVisible()&&await plain.locator(".static-skill-list").innerText().then(text=>text.includes("Python")));
  }finally{await plainContext.close();}
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
