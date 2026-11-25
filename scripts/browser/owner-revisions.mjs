globalThis.checkOwnerRevisions = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  for(const [width,height] of [[533,653],[390,844],[768,900],[1440,1000]]) {
    await page.setViewportSize({width,height});
    await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
    await frames();
    const fit=await page.locator(".featured-stack").evaluate(root=>({
      mode:root.dataset.stack,heights:[...root.querySelectorAll(".featured-card")].map(card=>card.offsetHeight),
      header:parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height")),
    }));
    check(`${width}x${height}/stack-active`,fit.mode==="active",fit);
    await page.evaluate(()=>window.scrollTo(0,0));await frames();
    const next=await page.locator(".stack-slot").nth(1).evaluate(el=>el.getBoundingClientRect().top+window.scrollY);
    await page.evaluate(top=>window.scrollTo(0,top-260),next);await frames();
    check(`${width}/stack-depth`,await page.locator(".featured-card").first().evaluate(card=>window.getComputedStyle(card).transform!=="none"));
  }
  for(const locale of ["id","en"])for(const width of [320,533,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const footer=await page.locator(".site-footer").evaluate(el=>{
      const links=[...el.querySelectorAll("a")],box=el.getBoundingClientRect();
      return {count:links.length,icons:links.every(a=>a.querySelector("img")?.complete&&a.querySelector("img")?.naturalWidth>0),
        accessible:links.every(a=>a.getAttribute("aria-label")&&a.offsetWidth>=44&&a.offsetHeight>=44),
        centered:Math.abs((el.querySelector("nav")?.getBoundingClientRect().left+el.querySelector("nav")?.getBoundingClientRect().right)/2-(box.left+box.right)/2)<2,
        names:links.map(a=>a.getAttribute("aria-label")),copyright:el.querySelector("small")?.textContent};
    });
    check(`${locale}/${width}/${theme}/footer`,footer.count===6&&footer.icons&&footer.accessible&&footer.centered,footer);
    check(`${locale}/${width}/${theme}/no-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    const spacing=await page.evaluate(()=>{
      const intro=document.querySelector(".intro").getBoundingClientRect();
      const stats=document.querySelector(".portfolio-stats")?.getBoundingClientRect();
      const skills=document.querySelector("#skills").getBoundingClientRect();
      return stats&&{afterIntro:stats.top-intro.bottom,beforeSkills:skills.top-stats.bottom,introPadding:parseFloat(window.getComputedStyle(document.querySelector(".intro")).paddingBottom)};
    });
    check(`${locale}/${width}/${theme}/shared-section-gap`,spacing&&Math.abs(spacing.beforeSkills-spacing.introPadding)<1,spacing);
    const visibleGap=await page.evaluate(()=>{
      const image=document.querySelector(".portrait-normal"),box=image.getBoundingClientRect();
      const drawnHeight=Math.min(box.height,box.width*960/768);
      const labels=[...document.querySelectorAll(".stats-list dt")].map(el=>el.getBoundingClientRect().bottom);
      return box.bottom-drawnHeight+drawnHeight*100/960-Math.max(...labels);
    });
    check(`${locale}/${width}/${theme}/visible-portrait-gap`,Math.abs(visibleGap-spacing.introPadding)<2,visibleGap);
    const alpha=await page.locator(".featured-info").first().evaluate(el=>{
      const color=window.getComputedStyle(el).backgroundColor;
      const values=color.match(/[\d.]+/g)?.map(Number);
      return {color,alpha:color.startsWith("color(")?Number(color.split("/")[1]?.replace(")","").trim()):values?.[3]??1};
    });
    check(`${locale}/${width}/${theme}/solid-info`,alpha.alpha===1,alpha);
    const contrast=await page.locator(".featured-info").first().evaluate((el,alpha)=>{
      const rgb=color=>color.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance=channels=>channels.map(value=>{
        const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
      }).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
      const canvas=rgb(window.getComputedStyle(document.body).backgroundColor);
      let minimum=Infinity;
      for(const node of el.querySelectorAll("h3,p"))for(const imageChannel of [0,255]) {
        const under=canvas.map(c=>c*alpha+imageChannel*(1-alpha));
        const foreground=luminance(rgb(window.getComputedStyle(node).color)),background=luminance(under);
        minimum=Math.min(minimum,(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05));
      }
      return minimum;
    },alpha.alpha);
    check(`${locale}/${width}/${theme}/text-contrast-over-any-image`,contrast>=4.5,contrast);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator(".footer-socials a").first().focus();await page.keyboard.press("Tab");
  check("footer/keyboard",await page.locator(".footer-socials a").nth(1).evaluate(el=>el===document.activeElement&&parseFloat(window.getComputedStyle(el).outlineWidth)>0));
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
