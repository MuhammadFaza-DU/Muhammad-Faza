globalThis.captureOwnerPolish = async page => {
  const base=".superpowers/sdd/2026-11-15-owner-polish";
  const captures=[];
  for(const theme of ["light","dark"]) {
    await page.setViewportSize({width:1440,height:1000});
    await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme)await page.locator("[data-theme-toggle]").click();
    await page.mouse.move(0,0);
    await page.waitForSelector('.hero-dot-grid canvas[data-ready="true"]');
    await page.waitForFunction(()=>document.querySelector(".hero-dot-grid canvas").dataset.running==="false");
    await page.screenshot({path:`${base}/hero-${theme}.png`});captures.push(`hero-${theme}.png`);
    await page.locator("#skills").scrollIntoViewIfNeeded();
    await page.waitForSelector(".skill-showcase[data-enhanced]");
    await page.locator(".orbit-tool img").evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    await page.keyboard.press("Tab");
    await page.locator('.orbit-tool[aria-label="OpenCode"]').focus();
    await page.waitForFunction(()=>document.querySelector(".skill-showcase").dataset.toolPaused==="true");
    await page.locator('.orbit-tool[aria-label="OpenCode"]').screenshot({path:`${base}/opencode-filled-${theme}.png`});
    await page.locator("#hire").scrollIntoViewIfNeeded();
    await page.locator(".hiring-portrait img").evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    await page.mouse.move(0,100);
    await page.locator("#hire").screenshot({path:`${base}/hiring-${theme}.png`});
    await page.goto("http://127.0.0.1:4321/id/contact/",{waitUntil:"networkidle"});
    await page.locator("[data-language-toggle]").click();
    await page.screenshot({path:`${base}/language-desktop-${theme}.png`});
    await page.setViewportSize({width:390,height:844});
    await page.goto("http://127.0.0.1:4321/id/contact/",{waitUntil:"networkidle"});
    await page.locator("[data-preferences-trigger]").click();
    await page.locator("[data-language-toggle]").click();
    await page.screenshot({path:`${base}/language-phone-${theme}.png`});
  }
  return {captures};
}
