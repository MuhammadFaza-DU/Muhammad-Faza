globalThis.checkCatalogKeyboard = async page => {
  const results=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  await page.setViewportSize({width:1440,height:1000});
  for(const [locale,theme] of [["id","light"],["en","dark"]]) {
    await page.goto(`http://127.0.0.1:4321/${locale}/project/`,{waitUntil:"networkidle"});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    for(const [category,want] of [["app",1],["hardware",1],["hybrid",0],["tools",4],["web",5],["all",11]]) {
      await page.locator(`[data-catalog-category="${category}"]`).click();
      const count=await page.locator("[data-catalog-card]:not([hidden])").count();
      check(`${locale} ${category} control filters actual records`,count===want,count);
    }
    const cards=await page.locator("[data-catalog-card]").evaluateAll(cards=>cards.map(card=>({
      id:card.dataset.projectId,href:card.querySelector("a").getAttribute("href"),title:card.querySelector("h2").textContent,
    })));
    for(const card of cards) {
      await page.locator(`[data-project-id="${card.id}"] a`).click();
      await page.waitForURL(`**${card.href}`);
      const title=await page.locator("h1").textContent();
      check(`${locale} ${card.id} card opens its own Detail`,title===card.title,{title,path:page.url()});
      await page.locator("[data-catalog-back]").click();
      await page.waitForSelector("[data-catalog-controls]:not([hidden])");
    }
    await page.locator("[data-catalog-query]").focus();
    await page.keyboard.type("C++");
    await page.waitForTimeout(300);
    const ids=await page.locator("[data-catalog-card]:not([hidden])").evaluateAll(cards=>cards.map(card=>card.dataset.projectId));
    check(`${locale} keyboard search resolves technology`,JSON.stringify(ids)==='["mini-notepad"]',ids);
    const anchor=page.locator('[data-project-id="mini-notepad"] a');
    await anchor.focus();
    await page.keyboard.press("Tab");
    const focus=await page.evaluate(()=>({hidden:!!document.activeElement?.closest("[hidden]"),catalog:!!document.activeElement?.closest("[data-catalog-card]")}));
    check(`${locale} hidden results are skipped by Tab`,!focus.hidden&&!focus.catalog,focus);
    await page.keyboard.press("Shift+Tab");
    const ring=await anchor.evaluate(el=>({focused:el===document.activeElement,style:window.getComputedStyle(el).outlineStyle,width:window.getComputedStyle(el).outlineWidth}));
    check(`${locale}/${theme} native focus ring remains visible`,ring.focused&&ring.style!=="none"&&parseFloat(ring.width)>=2,ring);
    await page.keyboard.press("Enter");
    await page.waitForURL(`**/${locale}/project/mini-notepad-cpp/`);
    check(`${locale} Enter opens real Detail`,page.url().endsWith("/mini-notepad-cpp/"),page.url());
  }
  return {passed:results.every(item=>item.passed),results};
}
