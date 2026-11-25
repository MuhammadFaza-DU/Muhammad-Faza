globalThis.checkFeatured = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  for(const locale of ["id","en"])for(const width of [320,390,768,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator("#work").scrollIntoViewIfNeeded();
    await page.locator(".featured-info a").first().focus();await frames();
    await page.locator(".featured-card img").evaluateAll(images=>Promise.all(images.map(image=>{
      image.loading="eager";return image.decode();
    })));
    const actual=await page.locator(".featured-card").evaluateAll(cards=>cards.map(card=>{
      const field=card.querySelector(".featured-media").getBoundingClientRect(),info=card.querySelector(".featured-info").getBoundingClientRect();
      const box=card.getBoundingClientRect(),image=card.querySelector("img");
      return {inside:info.left>=field.left-1&&info.right<=field.right+1&&info.top>=field.top-1&&info.bottom<=field.bottom+1,
        rounded:parseFloat(window.getComputedStyle(card).borderRadius)>0,ratio:box.height/box.width,
        clipping:info.scrollHeight>info.clientHeight+1,hasMedia:!!image.currentSrc};
    }));
    check(`${locale}/${width}/${theme}/overlay`,actual.length===5&&actual.every(item=>item.inside&&item.rounded&&!item.clipping&&item.hasMedia),actual);
    const centered=await page.locator(".featured-stack").evaluate(el=>{
      const box=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();
      return Math.abs((box.left+box.right)/2-(parent.left+parent.right)/2)<2;
    });
    check(`${locale}/${width}/${theme}/centered-stack`,centered);
    if(width<768)check(`${locale}/${width}/${theme}/portrait`,actual.every(item=>item.ratio>=16/9-.02));
    if(width===390&&locale==="id") {
      await page.locator(".featured-card").first().scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{const img=document.querySelector(".featured-card img");return img.complete&&img.naturalWidth>0;});
      await page.screenshot({path:`.superpowers/sdd/2026-11-16-featured-comments-disclosure/featured-phone-${theme}.png`});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator("#work").scrollIntoViewIfNeeded();
  for(const index of [0,1,2,3,4]) {
    await page.evaluate(()=>window.scrollTo(0,0));await frames();
    await page.locator(".stack-slot").nth(index).evaluate(el=>el.scrollIntoView({block:"start"}));
    await frames();
    await page.locator(".featured-info a").nth(index).click();
    await page.waitForURL("**/en/project/*/");
    check(`detail-${index}/real-route`,await page.locator("h1").count()===1);
    await page.goBack();
    await page.waitForURL("**/en/");
    await page.waitForFunction(()=>!document.documentElement.hasAttribute("data-astro-transition"));
  }
  await page.setViewportSize({width:390,height:600});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  await page.locator("#work").scrollIntoViewIfNeeded();
  await frames();
  check("200%-text/no-overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  check("200%-text/content-grows",await page.locator(".featured-info").evaluateAll(items=>items.every(el=>el.scrollHeight<=el.clientHeight+1)));
  await page.setViewportSize({width:900,height:400});
  await frames();
  check("short-landscape/flow",await page.locator(".featured-stack").getAttribute("data-stack")==="flow");
  check("short-landscape/all-content-visible",await page.locator(".featured-card").evaluateAll(cards=>cards.every(card=>{
    const box=card.getBoundingClientRect(),info=card.querySelector(".featured-info").getBoundingClientRect();
    return info.top>=box.top-1&&info.bottom<=box.bottom+1;
  })));
  const broken=await page.context().browser().newContext();
  const failure=await broken.newPage();
  await failure.route("**/media/projects/tazk/featured-*.webp",route=>route.abort());
  await failure.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await failure.locator("#work").scrollIntoViewIfNeeded();
  await failure.waitForSelector(".featured-card .media-failure:not([hidden])");
  check("media-failure/honest-reserved",await failure.locator(".featured-card").first().evaluate(card=>card.offsetHeight>300&&card.querySelector("img").hidden));
  await broken.close();
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.evaluate(()=>window.scrollTo(0,0));await frames();
  await page.locator(".stack-slot").nth(1).evaluate(el=>el.scrollIntoView({block:"start"}));
  await frames();
  const title=page.locator("#featured-gamein"),before=await title.boundingBox();
  const diagnostic=()=>page.evaluate(()=>({scroll:window.scrollY,mode:document.querySelector(".featured-stack").dataset.stack,focus:document.activeElement.outerHTML.slice(0,120),
    slots:[...document.querySelectorAll(".stack-slot")].map(el=>el.getBoundingClientRect().top),titles:[...document.querySelectorAll(".featured-card h3")].map(el=>el.getBoundingClientRect().top)}));
  const beforeState=await diagnostic();
  await page.emulateMedia({reducedMotion:"reduce"});await frames();
  const after=await title.boundingBox();
  check("live-reduce/reading-anchor",Math.abs(after.y-before.y)<=2,{before:before.y,after:after.y,beforeState,afterState:await diagnostic()});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.locator(".featured-info a").first().focus();await frames();
  check("keyboard/stack-returns-flow",await page.locator(".featured-stack").getAttribute("data-stack")==="flow");
  await page.locator("#hire").scrollIntoViewIfNeeded();
  check("stack/no-extra-hold-before-hiring",await page.locator("#hire").evaluate(el=>{
    const previous=document.querySelector("#work").getBoundingClientRect(),box=el.getBoundingClientRect();
    return box.top-previous.bottom<150;
  }));
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
