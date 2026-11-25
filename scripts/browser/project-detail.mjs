globalThis.checkProjectDetail = async page => {
  const results=[],errors=[],consoleErrors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text());});
  const cases=[
    ["tazk",2],["gamein",2],["stackcrate",2],["capify",1],["mariokan",1],
    ["brawl-buddies",2],["mini-notepad-cpp",1],["czip",1],
    ["codecraft-optimizer",1],["optimizer-ai-web",1],["portfolio",2],
  ];
  for(const locale of ["id","en"])for(const width of [390,1440])for(const theme of ["light","dark"])for(const [slug,actions] of cases) {
    const id=`${locale}/${width}/${theme}/${slug}`;
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/project/${slug}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("[data-detail-image]").evaluate(img=>img.decode());
    const actual=await page.locator(".project-detail").evaluate(article=>{
      const frame=article.querySelector(".detail-image-frame"),heading=article.querySelector(".detail-heading");
      const f=frame.getBoundingClientRect(),h=heading.getBoundingClientRect();
      return {frame:f.toJSON(),heading:h.toJSON(),image:article.querySelector("img").currentSrc,
        reserved:f.width>200&&f.height>100,
        clipped:[...article.querySelectorAll("p,dd,a,h1,h2,h3")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent),
        sections:article.querySelectorAll(".detail-story section").length,
        paragraphCount:article.querySelectorAll('[aria-labelledby="detail-about"] p').length,
        facts:article.querySelectorAll("dt").length,
        sources:[...article.querySelectorAll(".detail-sources a")].map(a=>({href:a.href,target:a.target})),
      };
    });
    check(`${id}/real-media-structure`,actual.reserved&&actual.sections===3&&actual.paragraphCount>=2&&actual.facts>=2,actual);
    check(`${id}/responsive-layout`,width<1024?actual.heading.top>=actual.frame.bottom:actual.heading.left>actual.frame.right,actual);
    check(`${id}/no-clipping`,actual.clipped.length===0&&await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),actual.clipped);
    check(`${id}/native-actions`,await page.locator(".detail-actions a[target='_blank'][rel='noreferrer']").count()===actions&&actual.sources.every(a=>a.href.startsWith("https://")&&a.target==="_blank"),actual.sources);
    check(`${id}/direct-back-no-loader`,await page.locator("[data-catalog-back]").getAttribute("href")===`/${locale}/project/`&&await page.locator(".opening-screen").count()===0);
    if(slug==="capify")check(`${id}/no-invented-source`,!await page.locator(".project-detail a[href*='github.com']").count());
    if(slug==="portfolio")check(`${id}/v1-public-links`,await page.locator(".detail-actions").innerText().then(text=>(text.match(/V1/g)||[]).length===2));
    if(locale==="id"&&theme==="light"&&["tazk","gamein","mariokan","capify","czip"].includes(slug)) {
      await page.waitForFunction(()=>[...document.querySelectorAll(".detail-hero [data-motion-enter]")].every(el=>window.getComputedStyle(el).opacity==="1"&&window.getComputedStyle(el).filter==="none"));
      await page.screenshot({path:`.superpowers/sdd/2026-11-15-project-detail/${width}-${slug}.png`,fullPage:true});
    }
  }
  for(const width of [320,768]) {
    await page.setViewportSize({width,height:900});
    await page.goto("http://127.0.0.1:4321/en/project/brawl-buddies/",{waitUntil:"networkidle"});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    check(`${width}/enlarged-long-title`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1&&[...document.querySelectorAll(".project-detail p,.project-detail h1,.project-detail a,.project-detail dd")].every(el=>el.scrollWidth<=el.clientWidth+2)));
    await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/project/gamein/",{waitUntil:"networkidle"});
  await page.locator(".detail-actions a").first().focus();
  check("keyboard/project-action-focus",await page.locator(".detail-actions a").first().evaluate(el=>
    document.activeElement===el&&window.getComputedStyle(el).outlineStyle!=="none"));
  await page.locator("[data-catalog-back]").focus();
  check("keyboard/visible-focus",await page.locator("[data-catalog-back]").evaluate(el=>window.getComputedStyle(el).outlineStyle!=="none"));
  await page.keyboard.press("Enter");await page.waitForURL("**/en/project/");
  check("keyboard/native-back",await page.locator("[data-catalog-card]").count()===11);
  const browser=page.context().browser();
  const broken=await browser.newContext();
  const failure=await broken.newPage();
  await failure.route("**/media/projects/gamein/featured-catalog-wide.webp",route=>route.abort());
  await failure.goto("http://127.0.0.1:4321/en/project/gamein/",{waitUntil:"networkidle"});
  await failure.locator("[data-detail-media-error]:not([hidden])").waitFor();
  check("image-failure/reserved-useful",await failure.locator(".detail-image-frame").evaluate(el=>el.clientHeight>100)&&await failure.locator("[data-detail-image]").isHidden()&&await failure.locator("#detail-about").isVisible());
  await failure.goto("http://127.0.0.1:4321/en/project/czip/",{waitUntil:"networkidle"});
  check("image-failure/router-recovery",await failure.locator("[data-detail-image]").evaluate(img=>img.complete&&img.naturalWidth>0)&&await failure.locator("[data-detail-media-error]").isHidden());
  await broken.close();
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const plain=await nojs.newPage();
  await plain.goto("http://127.0.0.1:4321/id/project/czip/",{waitUntil:"networkidle"});
  check("noJS/content-and-native-links",await plain.locator(".detail-story section").count()===3&&await plain.locator("[data-detail-image]").evaluate(img=>img.complete&&img.naturalWidth>0)&&await plain.locator(".detail-actions a").count()===1);
  await plain.locator("[data-catalog-back]").click();await plain.waitForURL("**/id/project/");
  check("noJS/native-return",await plain.locator("[data-catalog-card]").count()===11);
  await nojs.close();
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("http://127.0.0.1:4321/en/project/tazk/",{waitUntil:"networkidle"});
  check("reduced/content-readable",await page.locator(".detail-heading").evaluate(el=>window.getComputedStyle(el).opacity==="1")&&await page.locator("[data-detail-image]").isVisible());
  await page.emulateMedia({reducedMotion:"no-preference"});
  check("no-page-errors",errors.length===0,errors);
  check("no-console-errors",consoleErrors.length===0,consoleErrors);
  return {passed:results.every(item=>item.passed),results,errors,consoleErrors};
}
