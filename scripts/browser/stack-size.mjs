globalThis.checkStackSize = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  for(const locale of ["id","en"])for(const theme of ["light","dark"])for(const [width,height] of [[1440,1000],[1280,720],[1024,768],[768,1024]]) {
    await page.setViewportSize({width,height});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.evaluate(()=>window.scrollTo(0,0));await frames();
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const label=`${locale}/${theme}/${width}x${height}`;
    const layout=await page.locator(".featured-stack").evaluate(el=>({
      width:el.clientWidth,parent:el.parentElement.clientWidth,
      centered:Math.abs(el.getBoundingClientRect().left+el.clientWidth/2-(el.parentElement.getBoundingClientRect().left+el.parentElement.clientWidth/2))<1,
      cards:[...el.querySelectorAll(".featured-card")].map(card=>({width:card.offsetWidth,height:card.offsetHeight})),
      description:el.parentElement.querySelector(".work-heading p")!==null,
      duplicateLink:el.parentElement.querySelectorAll(".all-projects-link").length,
      mode:el.dataset.stack,
    }));
    check(`${label}/centered-max80`,layout.centered&&layout.width<=layout.parent*.8+1,layout);
    check(`${label}/16:9`,layout.cards.every(card=>Math.abs(card.width/card.height-16/9)<.015),layout.cards);
    check(`${label}/title-only-no-duplicate-link`,!layout.description&&layout.duplicateLink===0,layout);
    check(`${label}/stack-still-active`,layout.mode==="active",layout.mode);
    const positions=await page.locator(".stack-slot").evaluateAll(slots=>slots.map(el=>el.getBoundingClientRect().top+window.scrollY));
    for(let index=0;index<positions.length;index++) {
      await page.evaluate(({top,index})=>{
        const root=document.querySelector(".featured-stack"),style=window.getComputedStyle(root);
        window.scrollTo(0,top-parseFloat(style.getPropertyValue("--stack-pin"))-index*parseFloat(style.getPropertyValue("--stack-offset"))+10);
      },{top:positions[index],index});
      await frames();
      const actual=await page.locator(".featured-card").nth(index).evaluate(card=>{
        const title=document.querySelector("#work-title").getBoundingClientRect(),box=card.getBoundingClientRect();
        const header=parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"));
        return {titleTop:title.top,titleBottom:title.bottom,cardTop:box.top,cardBottom:box.bottom,header,height:window.innerHeight,
          depth:document.querySelector(".featured-card").style.transform};
      });
      check(`${label}/phase${index}/title-card-visible`,actual.titleTop>=actual.header&&actual.titleBottom<actual.cardTop&&actual.cardBottom<=height-15,actual);
      if(index===positions.length-1)check(`${label}/existing-depth`,actual.depth.includes("scale"),actual.depth);
      if(locale==="id"&&width===1440) {
        await page.locator(".featured-card img").evaluateAll(images=>Promise.all(images.map(image=>{
          image.loading="eager";return image.decode();
        })));
        await page.screenshot({path:`.superpowers/sdd/2026-11-16-featured-comments-disclosure/stack-${theme}-phase${index}.png`});
      }
    }
    const exitStart=await page.evaluate(()=>window.scrollY);
    const maxScroll=await page.evaluate(()=>document.documentElement.scrollHeight-window.innerHeight);
    const exitFrames=[];
    for(let step=0;step<=8;step++) {
      await page.evaluate(top=>window.scrollTo(0,top),exitStart+(maxScroll-exitStart)*step/8);await frames();
      exitFrames.push(await page.evaluate(()=>{
        const title=document.querySelector("#work-title").getBoundingClientRect(),card=document.querySelector(".stack-slot:last-child .featured-card").getBoundingClientRect();
        const header=parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"));
        return {titleBottom:title.bottom,cardTop:card.top,header,clear:title.bottom<=header||title.bottom<=card.top};
      }));
    }
    check(`${label}/last-card-exit-no-title-overlap`,exitFrames.every(frame=>frame.clear),exitFrames);
    await page.locator("#hire").evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-60));await frames();
    check(`${label}/title-releases-before-hire`,await page.locator("#work-title").evaluate(el=>el.getBoundingClientRect().bottom<parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"))));
    if(locale==="id"&&width===1440)await page.screenshot({path:`.superpowers/sdd/2026-11-16-featured-comments-disclosure/stack-${theme}-exit.png`});
  }
  for(const locale of ["id","en"]) {
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    const action=page.locator(`.hiring-actions a[href="/${locale}/project/"]`);
    check(`${locale}/project-cta`,await action.count()===1);
    if(await action.count()) {
      await action.click();await page.waitForURL(`**/${locale}/project/`);
      check(`${locale}/project-cta-navigates`,await page.locator("h1").count()===1);
    }
  }
  for(const width of [390,533]) {
    await page.setViewportSize({width,height:653});
    await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    await page.locator(".featured-card").first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{
      const image=document.querySelector(".featured-card img");return image.complete&&image.naturalWidth>0;
    });
    const phone=await page.locator(".featured-stack").evaluate(el=>({
      width:el.clientWidth,parent:el.parentElement.clientWidth,mode:el.dataset.stack,
      headingPosition:window.getComputedStyle(document.querySelector(".work-heading")).position,
      image:document.querySelector(".featured-card img").currentSrc,
    }));
    check(`${width}/phone-layout-preserved`,phone.width===phone.parent&&phone.headingPosition==="static"&&phone.mode==="active"&&phone.image.includes("featured-catalog-tall"),phone);
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
