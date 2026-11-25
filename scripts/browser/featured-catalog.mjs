globalThis.checkFeaturedCatalog = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  for(const locale of ["id","en"])for(const width of [390,768,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.waitForFunction(()=>!["pending","releasing","failed"].includes(document.documentElement.dataset.opening));
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    for(const [index,id] of ["tazk","gamein","stackcrate","capify","mariokan"].entries()) {
      await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.locator(".stack-slot").nth(index).evaluate((el,index)=>{
        const root=el.parentElement,style=window.getComputedStyle(root);
        const pin=root.dataset.stack==="active"?parseFloat(style.getPropertyValue("--stack-pin"))+index*parseFloat(style.getPropertyValue("--stack-offset")):80;
        window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-pin+10,behavior:"instant"});
      },index);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.waitForFunction(id=>{
        const img=document.querySelector(`.media-${id} img`);
        return img.complete&&img.naturalWidth>0;
      },id);
      const actual=await page.locator(`.media-${id} img`).evaluate(img=>({
        src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight,
        card:img.closest(".featured-card").getBoundingClientRect().toJSON(),
        info:img.closest(".featured-card").querySelector(".featured-info").getBoundingClientRect().toJSON(),
        source:img.closest("picture").querySelector("source").media,
        foremost:(()=>{
          const card=img.closest(".featured-card"),box=card.getBoundingClientRect();
          return document.elementFromPoint(box.left+box.width/2,Math.max(80,box.top+box.height/2))?.closest(".featured-card")===card;
        })(),
      }));
      const variant=width<768?"tall":"wide";
      check(`${locale}/${width}/${theme}/${id}/catalog-source`,actual.src.endsWith(`/media/projects/${id}/featured-catalog-${variant}.webp`),actual);
      check(`${locale}/${width}/${theme}/${id}/media-panel-geometry`,actual.info.bottom<=actual.card.bottom+1&&actual.info.top>=actual.card.top-1&&
        (width<768?actual.card.height/actual.card.width>=16/9-.02:Math.abs(actual.card.width/actual.card.height-16/9)<.02),actual);
      check(`${locale}/${width}/${theme}/${id}/actual-visible-card`,actual.foremost,actual);
      if(locale==="id"&&[390,768,1440].includes(width)&&theme==="light") {
        await page.screenshot({path:`.superpowers/sdd/2026-11-16-featured-comments-disclosure/${width}-${id}.png`});
      }
    }
    check(`${locale}/${width}/${theme}/no-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
