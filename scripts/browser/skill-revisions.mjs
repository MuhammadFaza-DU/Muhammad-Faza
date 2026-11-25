globalThis.checkSkillRevisions=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const frames=()=>page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>++n===12?resolve():requestAnimationFrame(tick);tick();}));
  const sample=()=>page.evaluate(()=>({
    tool:document.querySelector(".orbit-tool")?.style.transform,
    tech:document.querySelector(".skill-loop-track")?.style.getPropertyValue("--travel-x"),
    paused:[document.querySelector(".skill-showcase")?.dataset.toolPaused,document.querySelector(".skill-showcase")?.dataset.technologyPaused],
  }));
  for(const locale of ["id","en"]){
    await page.setViewportSize({width:1440,height:1100});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.waitForFunction(()=>document.documentElement.dataset.opening==="complete",null,{timeout:20000});
    await page.locator(".skill-loop").scrollIntoViewIfNeeded();
    await page.waitForSelector('.skill-showcase[data-enhanced]');
    await page.waitForFunction(()=>{
      const el=document.querySelector(".skill-loop");
      return el.dataset.motionDirection&&!el.getAnimations().some(a=>a.playState==="running");
    });
    const groups=page.locator(".skill-loop-group");
    for(const clone of [false,true])for(const name of ["Python","C","C++","JavaScript","TypeScript","Dart","React","Next.js","Astro","Node.js","Flutter","SQL","Hono","Express","Vite","HTML","CSS","Tailwind CSS"]){
      await page.mouse.move(0,180);
      await page.locator(".skill-loop").hover();await frames();
      await page.waitForFunction(()=>document.querySelector(".skill-showcase").dataset.technologyPaused==="true",null,{timeout:1500})
        .catch(async()=>{throw new Error(JSON.stringify({locale,clone,name,phase:"hover",actual:await sample(),
          pointer:await page.locator(".skill-loop").evaluate(el=>({hover:el.matches(":hover"),box:el.getBoundingClientRect().toJSON(),
            focused:document.activeElement?.tagName,dialog:document.querySelector("#skill-explanation")?.open}))}));});
      const group=groups.nth(clone?1:0),item=group.locator(".skill-item").filter({hasText:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`)}).first();
      await item.evaluate(el=>{
        const viewport=el.closest(".skill-loop"),track=el.closest(".skill-loop-track");
        viewport.scrollLeft=0;track.style.setProperty("--focus-offset","0px");
        const shift=viewport.getBoundingClientRect().left+16-el.getBoundingClientRect().left;
        const current=new window.DOMMatrix(window.getComputedStyle(track).transform).m41;
        track.style.transform=`translate3d(${current+shift}px,0,0)`;
      });
      const box=await item.boundingBox();
      await page.evaluate(()=>{
        window.skillClickTrace=[];
        const record=event=>{
          window.skillClickTrace.push({type:event.type,target:event.target?.closest("[data-skill-id]")?.dataset.skillId,
            x:event.clientX,y:event.clientY,travel:document.querySelector(".skill-loop-track").style.cssText,
            scroll:document.querySelector(".skill-loop").scrollLeft,
            paused:document.querySelector(".skill-showcase").dataset.technologyPaused});
        };
        document.addEventListener("pointerdown",record,{once:true,capture:true});
        document.addEventListener("click",record,{once:true,capture:true});
      });
      await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
      await page.waitForTimeout(80);
      const opened=await page.locator("#skill-explanation").getAttribute("open")!==null;
      const title=opened?await page.locator("#skill-explanation h3").innerText():null;
      check(`${locale}/${clone?"copy":"original"}/${name}/opens-description`,opened&&title===name&&
        (await page.locator("#skill-explanation p").innerText()).length>20,{opened,title,trace:await page.evaluate(()=>window.skillClickTrace)});
      if(opened){
        await page.locator(".explanation-close").click();
        await page.locator(".skill-loop-track").evaluate(el=>el.style.removeProperty("transform"));
        await frames();const a=await sample();await frames();const b=await sample();
        check(`${locale}/${clone?"copy":"original"}/${name}/close-resumes`,a.tech!==b.tech&&b.paused[1]==="false",{a,b});
      }else await page.locator(".skill-loop-track").evaluate(el=>el.style.removeProperty("transform"));
    }
    await page.locator(".explanation-controls button").click();
    await page.waitForTimeout(30);
    check(`${locale}/list-has-entry-motion`,await page.locator(".all-skills").evaluate(el=>el.getAnimations().some(a=>a.playState==="running")));
    await page.waitForTimeout(300);
    const choices=page.locator(".all-skill-buttons button");
    for(let i=0;i<await choices.count();i++){
      const item=choices.nth(i),name=await item.innerText();
      await item.click();await page.waitForSelector("#skill-explanation[open]");
      await page.mouse.move(0,180);await frames();
      const a=await sample();await frames();const b=await sample();
      check(`${locale}/list/${name}/both-continue`,a.tool!==b.tool&&a.tech!==b.tech,{a,b});
      check(`${locale}/list/${name}/localized-content`,await page.locator("#skill-explanation h3").innerText()===name&&
        (await page.locator("#skill-explanation p").innerText()).length>20);
      await page.keyboard.press("Escape");
    }
    await page.locator(".explanation-controls button").click();
    await page.waitForTimeout(30);
    check(`${locale}/list-exit-motion-inert`,await page.locator(".all-skills").evaluate(el=>
      el.inert&&el.getAnimations().some(a=>a.playState==="running")));
    await page.waitForTimeout(300);
    check(`${locale}/list-closes-fully`,await page.locator(".all-skills").isHidden());
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
