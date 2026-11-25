globalThis.checkProjectCommentsScroll=async page=>{
  const results=[],errors=[];
  let records=[],serial=0;
  await page.route("**/project/*/",async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace(/data-comments-api(?:="[^"]*")?/,'data-comments-api="https://scroll-comments.test"')
      .replace(/data-comments-sitekey(?:="[^"]*")?/,'data-comments-sitekey="local-scroll-sitekey"')});
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*",route=>route.fulfill({
    contentType:"application/javascript",body:`window.turnstile={render:(_el,o)=>{window.scrollChallenge=o;queueMicrotask(()=>o.callback("local"));return "scroll";},
    reset:()=>queueMicrotask(()=>window.scrollChallenge.callback("local")),remove:()=>{}};`,
  }));
  await page.route("https://scroll-comments.test/**",async route=>{
    const request=route.request(),headers={"Access-Control-Allow-Origin":"http://127.0.0.1:4321","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
    if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(request.method()==="GET")return route.fulfill({headers,json:{ok:true,order:"asc",comments:records,nextCursor:null}});
    const input=request.postDataJSON();
    const comment={id:`${(++serial).toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      projectSlug:"portfolio",displayName:input.displayName,body:input.body,createdAt:new Date().toISOString()};
    records.unshift(comment);return route.fulfill({status:201,headers,json:{ok:true,comment}});
  });
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const width of [390,1440])for(const theme of ["light","dark"]){
    records=[];
    const height=width===390?844:1000;
    await page.setViewportSize({width,height});
    await page.goto(`http://127.0.0.1:4321/${locale}/project/portfolio/`,{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const panel=page.locator("[data-project-comments]"),list=panel.locator("[data-comments-list]");
    await panel.scrollIntoViewIfNeeded();
    const before=await page.locator(".detail-sidebar").evaluate(el=>({
      height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width,
      story:document.querySelector(".detail-story").getBoundingClientRect().toJSON(),
      storyOccupied:document.querySelector(".detail-story").lastElementChild.getBoundingClientRect().bottom-
        document.querySelector(".detail-story").getBoundingClientRect().top}));
    for(let i=0;i<8;i++){
      await panel.locator("input").fill(locale==="id"?"Pengunjung uji lokal":"Local test visitor");
      await panel.locator("textarea").fill(`LOCAL INTERCEPT SCROLL FIXTURE ${i+1}`);
      await panel.locator("button[type=submit]").click();
      await panel.locator("[data-comment-entry]").nth(i).waitFor();
    }
    const actual=await list.evaluate(el=>({height:el.clientHeight,content:el.scrollHeight,
      overflow:window.getComputedStyle(el).overflowY,entries:el.children.length,
      sidebar:document.querySelector(".detail-sidebar").getBoundingClientRect().height,
      pageHeight:document.documentElement.scrollHeight,tabIndex:el.tabIndex}));
    const id=`${locale}/${width}/${theme}`;
    check(`${id}/height-not-count-limit`,actual.height<=320&&actual.content>actual.height+60&&
      actual.entries===8&&["auto","scroll"].includes(actual.overflow),actual);
    check(`${id}/sidebar-growth-bounded`,actual.sidebar-before.height<=352,{before,actual});
    if(width===1440)check(`${id}/more-balanced-lower-tracks`,before.story.width/before.width<=1.65&&
      before.story.width/before.width>=.95,before);
    const keyboard=actual.tabIndex===0;
    if(keyboard){
      await list.focus();await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(120);
    }
    check(`${id}/keyboard-list-scroll`,keyboard&&await list.evaluate(el=>el.scrollTop>0),actual.tabIndex);
    await panel.locator("textarea").fill(("Isi komentar panjang tanpa dilipat.\n").repeat(30));
    await panel.locator("button[type=submit]").click();
    await list.locator("[data-comment-entry]").nth(8).waitFor();
    const long=await list.locator("[data-comment-message]").last().evaluate(el=>({
      length:el.textContent.length,height:el.getBoundingClientRect().height,
      client:el.clientHeight,scroll:el.scrollHeight,clamp:window.getComputedStyle(el).webkitLineClamp}));
    check(`${id}/long-comment-full-text`,long.length>900&&long.client>=long.scroll-1&&
      ["none","0"].includes(long.clamp),long);
    await list.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const lastVisible=await list.locator("[data-comment-entry]").last().evaluate(el=>{
      const item=el.getBoundingClientRect(),viewport=el.parentElement.getBoundingClientRect();
      return item.bottom<=viewport.bottom+1&&item.bottom>viewport.top;
    });
    check(`${id}/newest-reachable-without-growing-page`,lastVisible);
    check(`${id}/form-outside-scroll`,await panel.locator("form").evaluate(el=>!el.closest("[data-comments-list]")));
    await list.evaluate(el=>{el.scrollTop=0;});
    await list.hover();
    const pageY=await page.evaluate(()=>window.scrollY);
    await page.mouse.wheel(0,-180);await page.waitForTimeout(220);
    check(`${id}/wheel-boundary-returns-to-page`,await page.evaluate(()=>window.scrollY)<pageY-1);
    if(locale==="id"){
      await list.evaluate(el=>{el.scrollTop=0;});
      await panel.locator("input").fill("");await panel.locator("textarea").fill("");
      await panel.scrollIntoViewIfNeeded();
      await page.screenshot({path:`.superpowers/sdd/2026-11-16-persistent-project-comments/${width}-${theme}-scroll.png`});
    }
  }
  check("no-page-errors",!errors.length,errors);
  await page.unroute("**/project/*/");await page.unroute("https://scroll-comments.test/**");
  await page.unroute("https://challenges.cloudflare.com/turnstile/v0/api.js*");
  return {passed:results.every(r=>r.passed),results,errors};
}
