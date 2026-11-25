globalThis.checkCatalogTextThumbnails = async page => {
  const results=[];
  const base="file:///D:/Progamming/Project-SourceCode/WEBB/muhammad-faza-portfolio/.superpowers/sdd/2026-11-15-project-catalog/";
  await page.setViewportSize({width:960,height:600});
  for(const id of ["mini-notepad","czip","codecraft","optimizer-ai-web"]) {
    await page.goto(`${base}${id}-output.html`);
    const state=await page.locator("pre").evaluate(el=>({
      font:parseFloat(window.getComputedStyle(el).fontSize),
      bottom:el.getBoundingClientRect().bottom,
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      text:el.textContent,
    }));
    results.push({caseId:`${id} genuine excerpt readable at167px`,passed:state.font*167/960>=9.5&&state.bottom<=600&&state.overflow===0,actual:state});
  }
  return {passed:results.every(item=>item.passed),results};
}
