globalThis.checkDetailActions = async page => {
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const slugs=["tazk","gamein","stackcrate","capify","mariokan","brawl-buddies","mini-notepad-cpp","czip","codecraft-optimizer","optimizer-ai-web","portfolio"];
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const theme of ["light","dark"]) {
    const cases=[...slugs.map(slug=>({slug,width:1440})),
      ...[375,768,1024].map(width=>({slug:"gamein",width})),
      {slug:"portfolio",width:1440,large:true},{slug:"gamein",width:320,large:true}];
    for(const {slug,width,large=false} of cases) {
      await page.setViewportSize({width,height:1000});
      await page.goto(`http://127.0.0.1:4321/${locale}/project/${slug}/`,{waitUntil:"networkidle"});
      if(await page.locator("html").getAttribute("data-theme")!==theme) {
        if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
        await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
      }
      await page.locator("[data-detail-image]").evaluate(img=>img.decode());
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>[...document.querySelectorAll(".detail-hero [data-motion-enter]")].every(el=>
        window.getComputedStyle(el).opacity==="1"&&window.getComputedStyle(el).transform==="none"));
      if(large)await page.evaluate(()=>document.documentElement.style.fontSize="200%");
      const actual=await page.evaluate(()=>{
        const box=selector=>document.querySelector(selector).getBoundingClientRect().toJSON();
        const links=[...document.querySelectorAll(".detail-actions a")];
        return {frame:box(".detail-image-frame"),heading:box(".detail-heading"),actions:box(".detail-actions"),
          category:box(".detail-category"),summary:box(".detail-summary"),facts:box(".detail-facts"),
          links:links.map(el=>({box:el.getBoundingClientRect().toJSON(),grow:window.getComputedStyle(el).flexGrow,href:el.href})),
          overflow:document.documentElement.scrollWidth>window.innerWidth+1,
          clipped:[...document.querySelectorAll(".project-detail h1,.project-detail p,.project-detail a,.project-detail dd")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent),
          prose:[...document.querySelectorAll(".detail-summary,.detail-story p,.detail-materials p")].map(el=>({
            align:window.getComputedStyle(el).textAlign,last:window.getComputedStyle(el).textAlignLast,
          })),
          nonProse:[...document.querySelectorAll(".detail-heading h1,.detail-category,.detail-actions a,.detail-facts dd,.detail-story h2,.detail-story h3")].map(el=>window.getComputedStyle(el).textAlign),
        };
      });
      const id=`${locale}/${theme}/${slug}/${width}${large?"/200%":""}`;
      if(width>=1024&&!large) {
        check(`${id}/bottom-aligned`,Math.abs(actual.actions.bottom-actual.frame.bottom)<=1,actual);
        check(`${id}/intro-stays-at-top`,Math.abs(actual.category.top-actual.frame.top)<=1,actual);
      } else if(width>=1024)check(`${id}/enlarged-content-grows`,actual.actions.bottom>=actual.frame.bottom&&
        actual.links[0].box.top>=actual.summary.bottom+47,actual);
      else check(`${id}/natural-stacked-gap`,actual.heading.top>=actual.frame.bottom&&
        Math.abs(actual.links[0].box.top-actual.summary.bottom-24*(large?2:1))<=1,actual);
      check(`${id}/intrinsic-buttons-no-overlap`,actual.links.every(link=>
        link.grow==="0"&&link.box.width<=actual.heading.width+1&&link.box.height>=44&&link.box.top>=actual.summary.bottom+23)&&
        (actual.links.length<2||actual.links[1].box.top>=actual.links[0].box.bottom||actual.links[1].box.left>=actual.links[0].box.right),actual.links);
      check(`${id}/no-clipping`,!actual.overflow&&!actual.clipped.length&&
        actual.facts.top>=Math.max(actual.heading.bottom,actual.frame.bottom),actual.clipped);
      check(`${id}/justified-prose-natural-last-line`,actual.prose.length>0&&
        actual.prose.every(p=>p.align==="justify"&&p.last==="start"),actual.prose);
      check(`${id}/headings-actions-facts-not-justified`,actual.nonProse.every(align=>align!=="justify"),actual.nonProse);
      if(locale==="en"&&slug==="gamein"&&[375,1440].includes(width)&&!large) {
        await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
        await page.screenshot({path:`.superpowers/sdd/2026-11-15-detail-actions/${width}-${theme}.png`,fullPage:true});
      }
      if(large)await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
    }
  }
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(item=>item.passed),results,errors};
}
