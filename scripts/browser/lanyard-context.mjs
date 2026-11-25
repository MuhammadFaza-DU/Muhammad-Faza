globalThis.checkLanyardContext = async page => {
  const warnings=[];
  page.on("console",message=>{if(["warning","error"].includes(message.type()))warnings.push(message.text());});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
  await page.locator(".lanyard-canvas").evaluate(el=>{
    window.restoreLanyard=el.getContext("webgl2").getExtension("WEBGL_lose_context");
    window.restoreLanyard.loseContext();
  });
  await page.waitForSelector('.lanyard-portrait[data-ready="false"]');
  await page.evaluate(()=>window.restoreLanyard.restoreContext());
  await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  return {passed:!warnings.length,warnings};
}
