globalThis.checkHome = async page => {
  const origin = "http://127.0.0.1:4321";
  const results = [], errors = [], warnings = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  const check = (caseId, viewport, locale, theme, action, expected, actual, passed, evidencePath = null) =>
    results.push({caseId,viewport,locale,theme,action,expected,actual,passed,evidencePath});
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  for (const width of [320,390,768,1024,1440]) for (const locale of ["id","en"]) for (const theme of ["light","dark"]) {
    const viewport={width,height:900};
    await page.setViewportSize(viewport);
    await page.goto(`${origin}/${locale}/`,{waitUntil:"networkidle"});
    await page.locator("[data-theme-select]").selectOption(theme);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const photo = document.querySelector(".profile-card__photo");
      return photo.complete && photo.naturalWidth > 0 && document.querySelector(".gooey-nav").hasAttribute("data-enhanced");
    });
    await page.locator(".portrait-stage").evaluate(el=>el.scrollIntoView({block:"center"}));
    await page.waitForSelector(".skill-showcase[data-enhanced]");
    await page.waitForFunction(() => document.querySelector(".portrait-armor")?.complete);
    await settle();
    const actual=await page.evaluate(()=>{
      const header=document.querySelector(".site-header").getBoundingClientRect();
      const brand=document.querySelector(".site-header .brand").getBoundingClientRect();
      const preferences=document.querySelector(".preferences").getBoundingClientRect();
      const links=[...document.querySelectorAll(".gooey-nav__list:not([aria-hidden]) a")].map(el=>el.getBoundingClientRect());
      const images=[...document.querySelectorAll(".intro img,.portrait-stage img")].filter(el=>!el.naturalWidth).map(el=>el.src);
      return {
        overflow:document.documentElement.scrollWidth-window.innerWidth,
        lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,
        navCount:links.length,navVisible:links.every(b=>b.left>=0 && b.right<=window.innerWidth && b.top>=0 && b.bottom<=window.innerHeight),
        headerTop:header.top,mobileTopRow:window.innerWidth>=768 || Math.abs(brand.top-preferences.top)<=8,
        missingImages:images,h1:document.querySelectorAll("h1").length,
      };
    });
    check(`${width}/${locale}/${theme}`,viewport,locale,theme,"render/header/assets","No overflow; 3 visible links; real images; one H1",actual,
      actual.overflow<=1&&actual.lang===locale&&actual.theme===theme&&actual.navCount===3&&actual.navVisible&&actual.mobileTopRow&&actual.h1===1&&!actual.missingImages.length);
    if ([390,1440].includes(width)) {
      const prefix=`.superpowers/sdd/2026-11-14-portfolio-v2/home-${width}-${locale}-${theme}`;
      await page.getByRole("button",{name:locale==="id"?"Jeda animasi":"Pause animation",exact:true}).click();
      await page.mouse.move(0,0);
      await page.locator(".portrait-stage").screenshot({path:`${prefix}-portrait.png`});
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
      await page.screenshot({path:`${prefix}-intro.png`});
    }
  }
  await page.setViewportSize({width:390,height:400});
  await page.goto(`${origin}/en/`,{waitUntil:"networkidle"});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  await settle();
  const large=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-window.innerWidth,
    mode:document.querySelector(".site-header").dataset.mode,
    fixed:parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height")),
  }));
  check("large-text",{width:390,height:400},"en","system","200% text","No overflow; fixed header <=45% viewport",large,large.overflow<=1&&large.fixed<=180);
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`${origin}/en/`,{waitUntil:"networkidle"});
  await page.locator(".portrait-stage").evaluate(el=>el.scrollIntoView({block:"center"}));
  await page.waitForSelector(".skill-showcase[data-enhanced]");
  await page.getByRole("button",{name:"View all tools & technologies",exact:true}).click();
  for(let i=0;i<25;i++) {
    const button=page.locator("#all-skills button").nth(i);
    const name=await button.innerText();
    await button.click();
    const actual={title:await page.locator("#skill-explanation h3").innerText(),panels:await page.locator("#skill-explanation:visible").count()};
    check(`chooser/${i}`,{width:1440,height:900},"en","system",`select ${name}`,"Same panel; matching name",actual,actual.title===name&&actual.panels===1);
  }
  await page.getByRole("button",{name:"Close explanation",exact:true}).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button",{name:"Open explanation",exact:true}).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  const panelFocus=await page.evaluate(()=>({name:document.activeElement.textContent,hidden:document.querySelector("#skill-explanation").hidden}));
  check("panel/escape",{width:1440,height:900},"en","system","Escape","Closed; focus stays on static disclosure",panelFocus,panelFocus.hidden&&panelFocus.name==="Open explanation");
  await page.getByRole("button",{name:"Close list",exact:true}).click();
  for(let i=0;i<6;i++) await page.locator(".showcase-toolbar button").first().click();
  check("armor/rapid-toggle",{width:1440,height:900},"en","system","6 toggles","Original state; no queued restart",await page.locator(".portrait-armor").getAttribute("data-whole"),await page.locator(".portrait-armor").getAttribute("data-whole")===null);
  await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
  return {results,errors,warnings,passed:results.every(result=>result.passed)&&!errors.length};
}
