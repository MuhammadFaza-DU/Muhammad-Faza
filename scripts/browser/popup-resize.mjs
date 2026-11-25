globalThis.checkPopupResize = async page => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await page.locator(".explanation-controls button").click();
  await page.locator(".all-skill-buttons button").first().click();
  await page.waitForSelector("#skill-explanation[open]");
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>++n===20?resolve():requestAnimationFrame(tick);tick();}));
  const actual=await page.locator("#skill-explanation").evaluate(el=>({open:el.open,mode:el.dataset.mode,content:el.querySelector("h3")?.textContent}));
  return {actual,passed:actual.open&&actual.mode==="modal"&&!!actual.content};
}
