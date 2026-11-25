globalThis.checkHiringCard = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  for(const width of [320,390,1440])for(const locale of ["id","en"]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.locator("#hire").scrollIntoViewIfNeeded();
    const actual=await page.locator(".hiring-copy").evaluate(el=>({
      radius:parseFloat(window.getComputedStyle(el).borderRadius),
      background:window.getComputedStyle(el).backgroundColor,
      roles:[...el.querySelectorAll(".hiring-roles li")].map(li=>li.textContent.trim()),
      actions:[...el.querySelectorAll(".hiring-actions a")].map(a=>a.getAttribute("href")),
      actionBackgrounds:[...el.querySelectorAll(".hiring-actions a")].map(a=>window.getComputedStyle(a).backgroundColor),
      clipped:el.scrollWidth>el.clientWidth+1,
    }));
    check(`${locale}/${width}/framed-roles`,actual.radius>=16&&actual.background!=="rgba(0, 0, 0, 0)"&&actual.roles.length===6&&!actual.clipped,actual);
    check(`${locale}/${width}/real-actions`,actual.actions.includes(`/${locale}/contact/`)&&actual.actions.includes(`/${locale}/project/`),actual.actions);
    check(`${locale}/${width}/secondary-style-preserved`,actual.actionBackgrounds[0]!==actual.actionBackgrounds[1],actual.actionBackgrounds);
  }
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
