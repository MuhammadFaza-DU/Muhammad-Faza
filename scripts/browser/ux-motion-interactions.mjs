globalThis.checkUXMotionInteractions = async page => {
  const results=[],errors=[],warnings=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{
    if(message.type()==="error")errors.push(message.text());
    if(message.type()==="warning")warnings.push(message.text());
  });
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const ready=async()=>{await page.waitForTimeout(1300);};
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});await ready();
  check("no added gooey bridge over original navbar",await page.locator(".motion-bridge").count()===0);
  const cta=page.locator('.intro-actions a[href="/id/project/"]');
  const box=await cta.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.waitForTimeout(250);
  const surface=await page.locator(".action-sheen").evaluate(el=>({
    opacity:+window.getComputedStyle(el).opacity,rect:el.getBoundingClientRect().toJSON(),
    pointer:window.getComputedStyle(el).pointerEvents
  }));
  check("CTA surface responds without intercepting",surface.opacity>.5&&surface.pointer==="none"&&Math.abs(surface.rect.width-box.width)<2,surface);
  await page.mouse.down();await page.waitForTimeout(100);
  const press=await cta.evaluate(el=>({scale:window.getComputedStyle(el).scale,transform:window.getComputedStyle(el).transform}));
  check("CTA press visibly compresses",Number(press.scale)<.98,press);
  await page.mouse.move(4,500);await page.mouse.up();await page.waitForTimeout(450);
  check("press release does not accumulate scale",await cta.evaluate(el=>["none","1"].includes(window.getComputedStyle(el).scale)));
  await page.emulateMedia({reducedMotion:"reduce"});await page.waitForTimeout(100);
  check("live reduce clears sheen",await page.locator(".action-sheen").evaluate(el=>+window.getComputedStyle(el).opacity)<.05);
  const stableHeading=await page.locator("#intro-title").evaluate(el=>({
    opacity:+window.getComputedStyle(el).opacity,running:el.getAnimations().some(a=>a.playState==="running")
  }));
  check("live reduce does not replay completed readable text",stableHeading.opacity===1&&!stableHeading.running,stableHeading);
  await page.emulateMedia({reducedMotion:"no-preference"});
  for(const width of [390,768,1440])for(const locale of ["id","en"]){
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});await ready();
    for(const theme of ["light","dark"]){
      await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
      const metrics=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth>window.innerWidth,
        sticky:window.getComputedStyle(document.querySelector(".site-header")).position,
        overlays:[...document.querySelectorAll(".action-sheen,.motion-bridge")].map(el=>window.getComputedStyle(el).pointerEvents)
      }));
      check(`${width}/${locale}/${theme}/geometry`,!metrics.overflow&&metrics.sticky==="fixed"&&metrics.overlays.every(value=>value==="none"),metrics);
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});await ready();
  const nav=page.locator(".gooey-nav__list").first();
  await nav.locator('a[href="/id/project/"]').click();
  await page.waitForURL("**/id/project/");
  await page.waitForTimeout(100);
  const routeEntrance=await page.locator("main h1").evaluate(el=>({
    name:window.getComputedStyle(el).animationName,duration:parseFloat(window.getComputedStyle(el).animationDuration),
    opacity:+window.getComputedStyle(el).opacity
  }));
  check("actual router has new content entrance",routeEntrance.name!=="none"&&routeEntrance.duration>=.6,routeEntrance);
  await ready();
  check("route exits fully readable",await page.locator("main").evaluate(el=>+window.getComputedStyle(el).opacity)===1);
  await page.goBack();await page.waitForURL("**/id/");await ready();
  check("back navigation preserves home route",await page.locator("#intro-title").isVisible());
  await nav.locator('a[href="/id/contact/"]').click();await page.waitForURL("**/id/contact/");await ready();
  check("contact form remains usable",await page.locator("[data-contact-form]").isVisible());
  await page.emulateMedia({reducedMotion:"reduce"});
  await nav.locator('a[href="/id/project/"]').click();await page.waitForURL("**/id/project/");
  const calmRoute=await page.locator("main h1").evaluate(el=>({
    name:window.getComputedStyle(el).animationName,duration:parseFloat(window.getComputedStyle(el).animationDuration),
    filter:window.getComputedStyle(el).filter,transform:window.getComputedStyle(el).transform
  }));
  check("reduced actual navigation still fades",calmRoute.name==="motion-fade"&&calmRoute.duration>=.3,calmRoute);
  check("reduced router arrival has no spatial motion",calmRoute.filter==="none"&&calmRoute.transform==="none",calmRoute);
  await ready();
  await page.locator('.catalog-list article a[href="/id/project/tazk/"]').click();
  await page.waitForURL("**/id/project/tazk/");await ready();
  check("detail link remains real",await page.locator("main h1").textContent()==="Tazk");
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});await ready();
  await page.locator(".intro-actions").screenshot({path:".superpowers/sdd/2026-11-15-ux-motion/v2-controls.png"});
  check("console clean",errors.length===0&&warnings.length===0,{errors,warnings});
  return {passed:results.every(result=>result.passed),results,errors,warnings};
}
