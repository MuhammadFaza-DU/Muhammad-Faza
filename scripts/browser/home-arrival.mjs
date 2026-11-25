globalThis.checkHomeArrival=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.addInitScript(()=>{
    window.homeFrames=[];
    const sample=()=>{
      const intro=document.querySelector("#intro"),portrait=intro?.querySelector(".lanyard-portrait");
      if(intro&&portrait){
        const visible=element=>{
          for(let el=element;el;el=el.parentElement){
            const s=window.getComputedStyle(el);
            if(s.visibility!=="visible"||s.display==="none"||Number(s.opacity)<.01)return false;
          }
          return !!element;
        };
        window.homeFrames.push({ready:portrait.dataset.ready,reduced:portrait.dataset.reduced,
          fallback:visible(intro.querySelector(".lanyard-fallback")),hero:visible(intro),
          opening:document.documentElement.dataset.opening,entry:document.documentElement.dataset.homeEntry,
          time:window.performance.now()});
      }
      if(window.homeFrames.length<1600)requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    document.addEventListener("astro:before-swap",()=>{window.homeFrames=[];});
  });
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"no-preference"});
  for(const locale of ["id","en"]){
    let release;
    const held=new Promise(resolve=>{release=resolve;});
    await page.route("**/media/lanyard/strap.webp",async route=>{await held;await route.continue();});
    await page.goto(`http://127.0.0.1:4321/${locale}/contact/`,{waitUntil:"networkidle"});
    await page.locator(`.gooey-nav__list:not([aria-hidden]) a[href="/${locale}/"]`).click();
    await page.waitForURL(`**/${locale}/`);
    await page.waitForTimeout(500);
    const waiting=await page.evaluate(()=>({
      frames:window.homeFrames,loader:window.getComputedStyle(document.querySelector(".opening-screen")).display,
      headerInert:document.querySelector(".site-header").inert,
      heroInert:document.querySelector("#intro").inert,
    }));
    check(`${locale}/held-texture-no-fallback-flash`,waiting.frames.length>0&&
      waiting.frames.filter(f=>f.ready!=="true").every(f=>!f.hero&&!f.fallback),waiting);
    check(`${locale}/no-MF-header-remains-usable`,waiting.loader==="none"&&!waiting.headerInert&&waiting.heroInert,waiting);
    release();
    await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:20000});
    await page.waitForTimeout(1200);
    check(`${locale}/ready-shows-real-engine`,await page.locator(".lanyard-canvas").isVisible()&&
      await page.locator("#intro-title").isVisible()&&!await page.locator("#intro").evaluate(el=>el.inert));
    await page.unroute("**/media/lanyard/strap.webp");
    const work=page.locator(".intro-actions a").first();
    check(`${locale}/work-goes-to-catalog`,await work.getAttribute("href")===`/${locale}/project/`);
    for(const source of ["project/","project/gamein/","contact/"]){
      await page.goto(`http://127.0.0.1:4321/${locale}/${source}`,{waitUntil:"networkidle"});
      await page.locator(`.gooey-nav__list:not([aria-hidden]) a[href="/${locale}/"]`).click();
      await page.waitForURL(`**/${locale}/`);
      await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:20000});
      await page.waitForTimeout(900);
      const samples=await page.evaluate(()=>window.homeFrames);
      check(`${locale}/${source}/no-pre-ready-photo`,samples.filter(f=>f.ready!=="true").every(f=>!f.hero&&!f.fallback),samples.slice(0,12));
      await page.goBack();await page.waitForURL(`**/${locale}/${source}`);
      await page.goForward();await page.waitForURL(`**/${locale}/`);
      await page.waitForSelector('.lanyard-portrait[data-ready="true"]',{timeout:20000});
      await page.waitForTimeout(900);
      check(`${locale}/${source}/history-no-flash`,await page.evaluate(()=>window.homeFrames.filter(f=>f.ready!=="true").every(f=>!f.hero&&!f.fallback)));
    }
    for(const theme of ["light","dark"]){
      await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
      const effects=[];
      for(const selector of [".intro-actions .button-secondary",".hiring-projects"]){
        const button=page.locator(selector);
        await button.scrollIntoViewIfNeeded();await page.waitForTimeout(800);
        const box=await button.boundingBox();
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        await page.waitForTimeout(220);
        effects.push(await page.locator(".action-sheen").evaluate(el=>({
          inverse:el.dataset.inverse,opacity:+window.getComputedStyle(el).opacity,
          colors:window.getComputedStyle(el).backgroundImage.match(/rgba?\([^)]*\)/g)?.join(","),
        })));
      }
      check(`${locale}/${theme}/secondary-sheen-matches`,effects.every(s=>s.opacity>.5)&&
        effects[0].inverse===effects[1].inverse&&effects[0].colors===effects[1].colors,effects);
    }
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
