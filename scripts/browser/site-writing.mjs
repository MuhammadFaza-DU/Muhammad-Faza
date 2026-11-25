globalThis.checkSiteWriting=async (page,{quick=false}={})=>{
  const results=[],errors=[],blockedWrites=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.context().route("**/*",async route=>{
    const request=route.request(),url=new URL(request.url());
    if(!["GET","HEAD","OPTIONS"].includes(request.method())&&url.hostname!=="127.0.0.1"){
      blockedWrites.push({method:request.method(),url:request.url()});
      return route.abort();
    }
    return route.fallback();
  });
  await page.route("**/project/*/",async route=>{
    try{
      const response=await route.fetch({maxRetries:1});
      await route.fulfill({response,body:(await response.text())
        .replace(/data-comments-api(?:="[^"]*")?/,'data-comments-api="https://writing-comments.test"')
        .replace(/data-comments-sitekey(?:="[^"]*")?/,'data-comments-sitekey="writing-test"')});
    }catch{
      await route.abort().catch(()=>{});
    }
  });
  const visitor="aku, kita dan kamu.\n<script>window.visitorExecuted=true</script>\n"+"Panjang".repeat(75);
  await page.route("https://writing-comments.test/**",route=>route.fulfill({json:{
    ok:true,order:"asc",comments:[{id:"11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      projectSlug:new URL(route.request().url()).pathname.split("/")[3],
      displayName:"Visitor <b>literal</b>",body:visitor,createdAt:"2026-11-16T04:00:00.000Z"}],nextCursor:null,
  },headers:{"access-control-allow-origin":"*"}}));
  await page.route("https://challenges.cloudflare.com/**",route=>route.abort());
  const prose=[
    ".intro-description p",".hiring-copy > p",".skills-section .section-heading p",
    ".featured-info p:not(.featured-status)",".contact-opening > p",".social-profiles > p",
    ".contact-form-lead",".catalog-heading > p",".catalog-summary",".detail-summary",
    ".detail-story p",".detail-materials p",".skill-explanation p",".static-skill-list p",
  ].join(",");
  const noProse="h1,h2,h3,.catalog-category,.catalog-status,.featured-status,.stats-list dt,.detail-category,.project-comments-status,[data-comment-message]";
  const lines=async selector=>page.locator(selector).evaluate(el=>{
    const walker=document.createTreeWalker(el,window.NodeFilter.SHOW_TEXT),rows=new Map();
    for(let node=walker.nextNode();node;node=walker.nextNode())for(const word of node.textContent.matchAll(/\S+/g)){
      const range=document.createRange();
      range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
      const rect=range.getBoundingClientRect(),top=Math.round(rect.top);
      if(rect.width&&rect.height)rows.set(top,[...(rows.get(top)??[]),word[0]]);
    }
    return [...rows.values()].map(words=>words.join(" "));
  });
  const go=async(route,width,theme)=>{
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321${route}`,{waitUntil:"networkidle"});
    await page.evaluate(()=>document.fonts.ready);
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
  };
  const inspect=async id=>{
    const actual=await page.evaluate(({prose,noProse})=>{
      const visible=el=>{const box=el.getBoundingClientRect();return box.width>0&&box.height>0&&!el.hidden;};
      const paragraphs=[...document.querySelectorAll(prose)].filter(visible).map(el=>{
        const css=window.getComputedStyle(el);
        return {text:el.textContent,align:css.textAlign,last:css.textAlignLast};
      });
      return {overflow:document.documentElement.scrollWidth>window.innerWidth+1,
        paragraphs,wrongExclusions:[...document.querySelectorAll(noProse)].filter(visible)
          .filter(el=>window.getComputedStyle(el).textAlign==="justify").map(el=>el.className),
        clipped:[...document.querySelectorAll("main h1,main h2,main h3,main p,main a,main label")]
          .filter(visible).filter(el=>el.scrollWidth>el.clientWidth+2)
          .filter(el=>window.getComputedStyle(el).position!=="absolute")
          .map(el=>({class:el.className,text:el.textContent})),
      };
    },{prose,noProse});
    check(`${id}/prose-justified`,actual.paragraphs.every(p=>p.align==="justify"&&p.last==="start"),actual.paragraphs);
    check(`${id}/labels-and-visitor-not-stretched`,!actual.wrongExclusions.length,actual.wrongExclusions);
    check(`${id}/reflow`,!actual.overflow&&!actual.clipped.length,{overflow:actual.overflow,clipped:actual.clipped});
  };
  for(const locale of ["id","en"]){
    await go(`/${locale}/project/`,1440,"light");
    const details=await page.locator("[data-catalog-card] a.catalog-card").evaluateAll(anchors=>anchors.map(a=>new URL(a.href).pathname));
    for(const width of (quick?[1440]:[1440,390]))for(const theme of (quick?["light"]:["light","dark"])){
      for(const route of [`/${locale}/`,`/${locale}/contact/`,...(quick?[]:[`/${locale}/project/`,...details])]){
        await go(route,width,theme);const id=`${route}/${width}/${theme}`;
        await inspect(id);
        if(route===`/${locale}/`){
          const heading=await lines(".hiring-copy h2");
          if(width>=1440)check(`${id}/heading-complete-line`,heading.length===1,heading);
          check(`${id}/role-title`,(await page.title()).endsWith("AI, Software, & Embedded Systems"));
          if(!quick){
            await page.setViewportSize({width,height:width<768?2000:1000});
            await page.locator("#hire").scrollIntoViewIfNeeded();
            await page.waitForFunction(()=>[...document.querySelectorAll("#hire [data-motion-scroll],#hire [data-motion-enter],#hire [data-motion-layer]")]
              .every(el=>Number(window.getComputedStyle(el).opacity)===1));
            await page.evaluate(()=>document.activeElement?.blur());
            await page.locator("#hire").screenshot({path:`.superpowers/sdd/2026-11-16-site-writing-typography/hiring-${locale}-${width}-${theme}.png`});
            await page.setViewportSize({width,height:1000});
          }
        }
        if(route.includes("/contact/")){
          if(width>=1440){
            const title=await lines(".contact-opening h1");
            check(`${id}/contact-heading-complete-line`,title.length===1,title);
          }
          for(const selector of [".contact-opening > p",".contact-form-lead"]){
            const actual=await lines(selector);
            if(width>=1440)check(`${id}/${selector}/sentence-lines`,actual.length===2&&actual.every(s=>/[.!?]$/.test(s)),actual);
          }
          if(!quick){
            await page.locator(".contact-form-panel").scrollIntoViewIfNeeded();
            await page.waitForFunction(()=>Number(window.getComputedStyle(document.querySelector(".contact-form-panel")).opacity)===1);
            await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
            await page.screenshot({path:`.superpowers/sdd/2026-11-16-site-writing-typography/contact-${locale}-${width}-${theme}.png`,fullPage:true});
          }
        }
      }
    }
    if(quick)continue;
    for(const width of [320,768,1024,1920])for(const suffix of ["","contact/","project/","project/brawl-buddies/"]){
      const route=`/${locale}/${suffix}`;await go(route,width,"light");
      await inspect(`stress/${route}/${width}`);
      if(width===320){
        await page.evaluate(()=>document.documentElement.style.fontSize="200%");
        await inspect(`zoom200/${route}/${width}`);
        await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
      }
    }
    await go(`/${locale}/project/gamein/`,390,"light");
    await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
    await page.locator("[data-comment-message]").waitFor();
    check(`${locale}/visitor-body-verbatim`,await page.locator("[data-comment-message]").textContent()===visitor&&
      await page.locator("[data-comment-entry] script,[data-comment-entry] b").count()===0&&
      await page.evaluate(()=>!window.visitorExecuted));
    await page.locator("[data-comments-list]").focus();
    check(`${locale}/comment-list-keyboard`,await page.locator("[data-comments-list]").evaluate(el=>
      document.activeElement===el&&window.getComputedStyle(el).outlineStyle!=="none"));
    await go(`/${locale}/`,390,"light");
    await page.locator(".skill-showcase").scrollIntoViewIfNeeded();
    await page.locator(".explanation-controls button").click();
    await page.locator(".all-skill-buttons button").first().click();
    await page.locator(".skill-explanation[open]").waitFor();
    await inspect(`${locale}/popup/390`);
    await page.keyboard.press("Escape");
    await page.locator(".skill-explanation").waitFor({state:"hidden"});
    await page.setViewportSize({width:320,height:1000});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    await page.locator(".all-skill-buttons button").first().click();
    await page.locator(".skill-explanation[open]").waitFor();
    await inspect(`${locale}/popup/320/zoom200`);
    await page.keyboard.press("Escape");
  }
  check("no-page-errors",!errors.length,errors);
  check("no-unhandled-remote-writes",!blockedWrites.length,blockedWrites);
  return {passed:results.every(result=>result.passed),results,errors,blockedWrites};
}
