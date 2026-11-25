globalThis.checkThemeIcons = async page => {
  const results=[];
  for(const width of [320,390,1440])for(const locale of ["id","en"]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:4321/${locale}/contact/`,{waitUntil:"networkidle"});
    const toggle=page.locator("[data-theme-toggle]");
    if(!await toggle.isVisible())await page.locator("[data-preferences-trigger]").click();
    for(const theme of ["light","dark"]) {
      if(await page.locator("html").getAttribute("data-theme")!==theme)await toggle.click();
      const actual=await toggle.evaluate(button=>{
        const sun=button.querySelector(".theme-icon--sun"),moon=button.querySelector(".theme-icon--moon");
        const visible=el=>!!el&&window.getComputedStyle(el).display!=="none"&&el.getBoundingClientRect().width>=12;
        const box=button.getBoundingClientRect();
        return {sun:visible(sun),moon:visible(moon),ariaHidden:!!sun?.closest('[aria-hidden="true"]')&&!!moon?.closest('[aria-hidden="true"]'),
          touchTarget:box.width>=44&&box.height>=44,overflow:document.documentElement.scrollWidth>window.innerWidth+1};
      });
      results.push({width,locale,theme,actual,passed:actual.sun===(theme==="light")&&actual.moon===(theme==="dark")&&actual.ariaHidden&&actual.touchTarget&&!actual.overflow});
    }
  }
  return {results,passed:results.every(item=>item.passed)};
}
