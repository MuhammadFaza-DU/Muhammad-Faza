globalThis.checkOrbitIconFill = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  for(const width of [390,1440])for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    await page.locator(".portrait-stage").scrollIntoViewIfNeeded();
    await page.waitForSelector(".skill-showcase[data-enhanced]");
    await page.waitForFunction(()=>[...document.querySelectorAll(".orbit-tool")].every(el=>el.style.transform.includes("translate3d")));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.waitForFunction(()=>document.querySelector(".portrait-stage").getAnimations().every(animation=>animation.playState!=="running"));
    const actual=await page.locator(".orbit-tool").evaluateAll(buttons=>buttons.map(button=>{
      const image=button.querySelector("img"),face=image.parentElement;
      const box=button.getBoundingClientRect(),imageBox=image.getBoundingClientRect(),faceBox=face.getBoundingClientRect();
      const style=window.getComputedStyle(face);
      return {name:button.getAttribute("aria-label"),hasFace:face!==button,
        fillsFace:Math.abs(imageBox.width-faceBox.width)<.5&&Math.abs(imageBox.height-faceBox.height)<.5,
        clipped:style.overflow==="hidden"&&parseFloat(style.borderRadius)>0,
        imageTransform:window.getComputedStyle(image).transform,hit:button.offsetWidth>=56&&button.offsetHeight>=56&&box.width>55.5&&box.height>55.5,
        decoded:image.complete&&image.naturalWidth>0};
    }));
    check(`${width}/${theme}/edge-to-edge-rounded-icons`,actual.length===7&&actual.every(item=>item.hasFace&&item.fillsFace&&item.clipped&&item.imageTransform==="none"&&item.hit&&item.decoded),actual);
    const openCode=page.locator('.orbit-tool[aria-label="OpenCode"]');
    await openCode.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector("#skill-explanation[open]");
    check(`${width}/${theme}/keyboard-explanation`,await page.locator("#skill-explanation").innerText().then(text=>text.includes("OpenCode")));
    await page.locator(".explanation-close").click();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.locator(".hiring-projects").evaluate(el=>el.focus({preventScroll:true}));
    await page.mouse.move(0,100);
    await page.waitForFunction(()=>document.querySelector(".skill-showcase").dataset.toolPaused==="false");
    const travel=await openCode.getAttribute("style");
    await page.evaluate(()=>new Promise(resolve=>{let frames=0;const step=()=>++frames===12?resolve():requestAnimationFrame(step);requestAnimationFrame(step);}));
    check(`${width}/${theme}/orbit-still-moves`,await openCode.getAttribute("style")!==travel);
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
