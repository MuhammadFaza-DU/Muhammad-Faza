globalThis.checkStackAnchor = async page => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  await page.locator(".stack-slot").nth(1).evaluate(el=>el.scrollIntoView({block:"start"}));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await settle();
  const snapshot=()=>page.evaluate(()=>({scrollY:window.scrollY,mode:document.querySelector(".featured-stack").dataset.stack,
    focus:document.activeElement.tagName,header:window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"),
    cards:[...document.querySelectorAll(".featured-card")].map(el=>{const b=el.getBoundingClientRect(),h=el.querySelector("h3").getBoundingClientRect();return {title:el.querySelector("h3").textContent,top:b.top,bottom:b.bottom,h3:h.top};})}));
  const before=await snapshot();
  await page.emulateMedia({reducedMotion:"reduce"});await settle();
  const after=await snapshot();
  return {before,after,passed:Math.abs(before.cards[1].h3-after.cards[1].h3)<=2};
}
