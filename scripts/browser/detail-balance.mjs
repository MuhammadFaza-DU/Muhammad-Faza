globalThis.checkDetailBalance = async page => {
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const theme of ["light","dark"])
    for(const [slug,width] of [["portfolio",1024],["portfolio",1440],["portfolio",1920],["brawl-buddies",1440],["tazk",1440],["mariokan",1440],["portfolio",375],["portfolio",768]]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(`http://127.0.0.1:4321/${locale}/project/${slug}/`,{waitUntil:"networkidle"});
      if(await page.locator("html").getAttribute("data-theme")!==theme) {
        if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
        await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
      }
      await page.locator("[data-detail-image]").evaluate(img=>img.decode());
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>[...document.querySelectorAll(".detail-hero [data-motion-enter]")].every(el=>
        window.getComputedStyle(el).opacity==="1"&&window.getComputedStyle(el).filter==="none"&&window.getComputedStyle(el).transform==="none"));
      const actual=await page.evaluate(()=>{
        const box=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
        const image=document.querySelector("[data-detail-image]"),style=window.getComputedStyle(image);
        return {preview:box(".detail-preview"),frame:box(".detail-image-frame"),heading:box(".detail-heading"),
          facts:box(".detail-facts"),hero:box(".detail-hero"),
          image:{width:image.naturalWidth,height:image.naturalHeight,fit:style.objectFit},
          titleSize:parseFloat(window.getComputedStyle(document.querySelector(".detail-heading h1")).fontSize),
          annotations:document.querySelectorAll(".detail-preview figcaption,.detail-full-image,.detail-preview a").length,
          overflow:document.documentElement.scrollWidth>window.innerWidth+1,
          clipped:[...document.querySelectorAll(".project-detail p,.project-detail h1,.project-detail a,.project-detail dd")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent),
        };
      });
      const id=`${locale}/${theme}/${width}/${slug}`;
      if(width>=1024) {
        check(`${id}/equal-tracks-top-aligned`,Math.abs(actual.preview.width-actual.heading.width)<2&&Math.abs(actual.frame.top-actual.heading.top)<2,actual);
        check(`${id}/proportional-title`,actual.titleSize<=52,actual.titleSize);
      } else check(`${id}/stacked`,actual.heading.top>=actual.frame.bottom,actual);
      check(`${id}/whole-image`,actual.image.fit==="contain"&&Math.abs(actual.frame.width/actual.frame.height-actual.image.width/actual.image.height)<.02,actual.image);
      check(`${id}/no-redundant-media-footer`,actual.annotations===0,actual.annotations);
      check(`${id}/natural-flow-no-clipping`,!actual.overflow&&!actual.clipped.length&&actual.facts.top>=actual.hero.bottom,actual.clipped);
      if(slug==="portfolio"&&locale==="en"&&[375,1440].includes(width)) {
        await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
        await page.screenshot({path:`.superpowers/sdd/2026-11-15-detail-balance/${width}-${theme}.png`,fullPage:true});
      }
    }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(item=>item.passed),results,errors};
}
