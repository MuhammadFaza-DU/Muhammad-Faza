globalThis.checkContactBalance = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.context().route("https://formspree.io/**",route=>route.abort());
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  for(const locale of ["id","en"])for(const width of [390,1024,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/contact/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.evaluate(async()=>{await document.fonts.ready;document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
    await page.locator(".contact-direct").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>window.getComputedStyle(document.querySelector(".contact-direct")).opacity==="1");
    await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const actual=await page.evaluate(()=>{
      const left=document.querySelector(".social-profiles").getBoundingClientRect(),right=document.querySelector(".contact-direct").getBoundingClientRect();
      const subject=document.querySelector("#contact-subject").getBoundingClientRect(),email=document.querySelector("#contact-email").getBoundingClientRect();
      const cards=[...document.querySelectorAll(".social-channel")].map(el=>el.getBoundingClientRect().toJSON());
      const occupiedLeft=Math.max(...cards.map(card=>card.bottom))-left.top;
      return {left:left.toJSON(),right:right.toJSON(),subject:subject.toJSON(),email:email.toJSON(),
        occupiedLeft,balance:Math.min(occupiedLeft,right.height)/Math.max(occupiedLeft,right.height),cards,
        clipped:[...document.querySelectorAll(".contact-page p,.contact-page label,.contact-page a")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent),
        overflow:document.documentElement.scrollWidth>window.innerWidth+1};
    });
    const id=`${locale}/${width}/${theme}`;
    if(width>=1024) {
      check(`${id}/social-two-by-three`,Math.abs(actual.cards[0].top-actual.cards[1].top)<2&&actual.cards[2].top>actual.cards[0].bottom&&actual.cards[4].top>actual.cards[2].bottom,actual.cards);
      check(`${id}/form-wider-top-aligned`,actual.right.width>actual.left.width&&Math.abs(actual.right.top-actual.left.top)<2,actual);
      check(`${id}/balanced-content-height`,Math.abs(actual.occupiedLeft-actual.right.height)<=32,actual);
      check(`${id}/subject-email-paired`,Math.abs(actual.subject.top-actual.email.top)<2&&actual.email.left>actual.subject.right,actual);
    } else check(`${id}/phone-stacked`,actual.right.top>actual.left.bottom&&actual.email.top>actual.subject.bottom,actual);
    check(`${id}/no-clipping`,!actual.clipped.length&&!actual.overflow,actual.clipped);
    if(locale==="id"&&[390,1440].includes(width))await page.screenshot({path:`.superpowers/sdd/2026-11-15-contact-footer/${width}-${theme}.png`,fullPage:true});
  }
  for(const width of [320,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    const enlarged=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>window.innerWidth+1,
      clipped:[...document.querySelectorAll(".contact-page p,.contact-page a,.contact-page h2")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>({text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth})),
    }));
    check(`${width}/200%-text`,!enlarged.overflow&&!enlarged.clipped.length,enlarged);
    await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  }
  await page.context().unroute("https://formspree.io/**");
  check("no-page-errors",errors.length===0,errors);
  return {passed:results.every(item=>item.passed),results,errors,realSubmissions:0};
}
