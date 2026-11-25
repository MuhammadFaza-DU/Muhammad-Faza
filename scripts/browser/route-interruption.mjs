globalThis.checkRouteInterruption=async page=>{
  const results=[],errors=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
  let release,requested;
  const held=new Promise(resolve=>{requested=resolve;});
  await page.route("**/en/project/",async route=>{
    requested();await new Promise(resolve=>{release=resolve;});
    try{await route.continue();}catch(error){if(!/handled|closed|aborted/i.test(String(error)))throw error;}
  });
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/project/"]').click({noWaitAfter:true});
  await held;
  await page.waitForTimeout(250);
  const waiting=await page.locator("main").evaluate(el=>+window.getComputedStyle(el).opacity);
  check("slow-navigation/old-content-not-dimmed",waiting>.99,waiting);
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/"]').click({noWaitAfter:true});
  release();await page.unroute("**/en/project/");
  await page.waitForURL("**/en/");
  await page.waitForFunction(()=>document.documentElement.dataset.homeEntry==="complete",null,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.routePhase==="settled");
  check("superseded-route/new-home-readable-unlocked",await page.locator("main").evaluate(el=>
    +window.getComputedStyle(el).opacity===1&&!el.inert&&!document.querySelector(".site-header").inert));
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/contact/"]').click();
  await page.waitForURL("**/en/contact/");
  await page.waitForFunction(()=>document.documentElement.dataset.routePhase==="settled");
  check("next-route/no-stale-gate",!await page.locator("main").evaluate(el=>el.inert)&&await page.locator("[data-contact-form]").isVisible());
  const popup=page.context().waitForEvent("page");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a[href="/en/project/"]').click({modifiers:["Control"]});
  const tab=await popup;await tab.close();
  check("modified-click/current-page-not-faded",await page.locator("main").evaluate(el=>+window.getComputedStyle(el).opacity===1));
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors};
}
