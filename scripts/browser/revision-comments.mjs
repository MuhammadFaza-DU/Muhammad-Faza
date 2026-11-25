globalThis.checkRevisionComments=async page=>{
  const results=[],errors=[],reads=[],writes=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  const uuid=n=>`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
  const make=n=>({id:uuid(n),projectSlug:"gamein",displayName:`Local ${n}`,body:`LOCAL fixture ${n}`,
    createdAt:new Date(Date.UTC(2026,10,16,0,n)).toISOString()});
  let records=[],mode="normal",acceptedNumber=46;
  await page.route("**/project/gamein/",async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace(/data-comments-api(?:="[^"]*")?/,'data-comments-api="https://chronology.test"')
      .replace(/data-comments-sitekey(?:="[^"]*")?/,'data-comments-sitekey="local-test"')});
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*",route=>route.fulfill({
    contentType:"application/javascript",body:`window.turnstile={render:(_,options)=>{window.localChallenge=options;queueMicrotask(()=>options.callback("local-token"));return "widget";},
    reset:()=>queueMicrotask(()=>window.localChallenge.callback("local-token")),remove:()=>{}};`,
  }));
  await page.route("https://chronology.test/**",async route=>{
    const request=route.request(),url=new URL(request.url()),headers={"access-control-allow-origin":"*","access-control-allow-headers":"Content-Type"};
    if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(request.method()==="GET"){
      reads.push({query:url.search,mode});
      if(mode==="failure")return route.fulfill({status:503,headers,json:{ok:false}});
      const cursor=url.searchParams.get("cursor"),point=cursor?JSON.parse(globalThis.atob(cursor.replaceAll("-","+").replaceAll("_","/"))):null;
      const remaining=records.filter(c=>!point||c.createdAt>point.createdAt||(c.createdAt===point.createdAt&&c.id>point.id));
      const comments=remaining.slice(0,20),last=comments.at(-1);
      const nextCursor=remaining.length>20?globalThis.btoa(JSON.stringify({id:last.id,createdAt:last.createdAt})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,""):null;
      return route.fulfill({headers,json:{ok:true,order:"asc",comments,nextCursor}});
    }
    const input=request.postDataJSON();writes.push(input);
    if(mode==="unconfirmed")return route.fulfill({status:503,headers,json:{ok:false,error:{code:"submission_unconfirmed"}}});
    const comment={...make(acceptedNumber),displayName:input.displayName,body:input.body};
    if(!records.some(c=>c.id===comment.id))records.push(comment);
    return route.fulfill({status:201,headers,json:{ok:true,comment}});
  });
  const ids=()=>page.locator("[data-comment-entry]").evaluateAll(nodes=>nodes.map(node=>node.dataset.commentEntry));
  for(const locale of ["id","en"])for(const width of [390,1440]){
    records=Array.from({length:45},(_,i)=>make(i+1));mode="normal";const initialReads=reads.length;
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/project/gamein/`,{waitUntil:"networkidle"});
    await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length===20);
    const label=`${locale}/${width}`;
    check(`${label}/oldest-initial-page`,JSON.stringify(await ids())===JSON.stringify(Array.from({length:20},(_,i)=>uuid(i+1))),await ids());
    check(`${label}/explicit-order`,reads.at(-1).query.includes("order=asc"),reads.at(-1));
    const firstTime=page.locator("[data-comment-entry] time").first();
    check(`${label}/timestamp-zone-year`,await firstTime.textContent()===(locale==="id"?"16 Nov 2026 · 07.01 WIB":"16 Nov 2026 · 00:01 UTC"),await firstTime.textContent());
    check(`${label}/semantic-original-time`,await firstTime.getAttribute("datetime")===make(1).createdAt);
    await page.locator(".project-comments-form input").fill("Local only");
    await page.locator(".project-comments-form textarea").fill("LOCAL newest submission");
    await page.locator(".project-comments-submit:not([disabled])").waitFor();
    await page.waitForFunction(()=>Boolean(window.localChallenge));
    await page.locator(".project-comments-submit").click();
    await page.locator(`[data-comment-entry="${uuid(46)}"]`).waitFor();
    check(`${label}/oldest-prefix-newest-tail`,JSON.stringify(await ids())===JSON.stringify([...Array.from({length:20},(_,i)=>uuid(i+1)),uuid(46)]),await ids());
    check(`${label}/history-gap-explicit`,await page.locator("[data-comments-gap]").count()===1);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    check(`${label}/no-unbounded-auto-history`,reads.length===initialReads+1,reads.length-initialReads);
    const row=page.locator(`[data-comment-entry="${uuid(46)}"]`);
    const position=()=>row.evaluate(el=>{
      const box=el.getBoundingClientRect(),list=el.closest("ol"),viewport=list.getBoundingClientRect();
      return {y:box.top-viewport.top,scrollTop:list.scrollTop,client:list.clientHeight,scroll:list.scrollHeight,
        visible:[...list.querySelectorAll("[data-comment-entry]")].filter(row=>row.getBoundingClientRect().bottom>viewport.top&&row.getBoundingClientRect().top<viewport.bottom).map(row=>row.dataset.commentEntry)};
    });
    const before=await position();
    check(`${label}/new-comment-visible`,await row.evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest("ol").getBoundingClientRect();return a.bottom>b.top&&a.top<b.bottom;}));
    await page.locator("[data-comments-more]").click();
    await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length>=41);
    const after=await position();
    check(`${label}/pagination-preserves-reading-anchor`,Math.abs(after.y-before.y)<=2,{before,after});
    while(await page.locator("[data-comments-more]").isVisible()){
      await page.locator("[data-comments-more]").click();
      await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length===46);
    }
    check(`${label}/all46-chronological-no-duplicates`,JSON.stringify(await ids())===JSON.stringify(Array.from({length:46},(_,i)=>uuid(i+1))));
    check(`${label}/gap-removed-when-filled`,await page.locator("[data-comments-gap]").count()===0);
    check(`${label}/no-page-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  }
  records=Array.from({length:45},(_,i)=>make(i+1));mode="normal";
  await page.goto("http://127.0.0.1:4321/en/project/gamein/",{waitUntil:"networkidle"});
  await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length===20);
  const list=page.locator("[data-comments-list]");
  await list.evaluate(el=>{el.scrollTop=300;});
  const anchor=await list.evaluate(el=>{
    const box=el.getBoundingClientRect(),row=[...el.children].find(row=>row.getBoundingClientRect().bottom>box.top+1);
    return {id:row.dataset.commentEntry,y:row.getBoundingClientRect().top-box.top};
  });
  mode="failure";await page.locator("[data-comments-more]").click();
  await page.getByRole("button",{name:"Try loading again"}).waitFor();
  check("partial-read-failure-keeps-prefix",await page.locator("[data-comment-entry]").count()===20&&await page.locator("[data-comments-empty]").isHidden());
  mode="normal";await page.locator("[data-comments-more]").click();
  await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length===40);
  const delta=await page.locator(`[data-comment-entry="${anchor.id}"]`).evaluate(el=>el.getBoundingClientRect().top-el.closest("ol").getBoundingClientRect().top)-anchor.y;
  check("ordinary-reading-anchor-preserved-through-failure-retry",Math.abs(delta)<=2,delta);
  await page.locator(".project-comments-form input").fill("Local retry");
  await page.locator(".project-comments-form textarea").fill("LOCAL retry draft");
  await page.waitForFunction(()=>Boolean(window.localChallenge));
  mode="unconfirmed";await page.locator(".project-comments-submit").click();
  await page.waitForFunction(()=>!document.querySelector(".project-comments-form").hasAttribute("aria-busy"));
  const requestId=writes.at(-1).requestId;
  check("unconfirmed-never-inserts-record",await page.locator("[data-comment-entry]").count()===40&&await page.locator(".project-comments-form textarea").inputValue()==="LOCAL retry draft");
  mode="normal";acceptedNumber=5;await page.locator(".project-comments-submit").click();
  await page.waitForFunction(()=>document.querySelector(".project-comments-form textarea").value==="");
  check("retry-keeps-id-and-no-duplicate",writes.at(-1).requestId===requestId&&await page.locator("[data-comment-entry]").count()===40);
  check("older-idempotent-result-revealed-at-chronological-position",await page.locator(`[data-comment-entry="${uuid(5)}"]`).evaluate(el=>{
    const a=el.getBoundingClientRect(),b=el.closest("ol").getBoundingClientRect();return a.bottom>b.top&&a.top<b.bottom;
  })&&!(await ids()).includes(uuid(46)));
  check("no-page-errors",!errors.length,errors);
  await page.unroute("**/project/gamein/");await page.unroute("https://chronology.test/**");
  await page.unroute("https://challenges.cloudflare.com/turnstile/v0/api.js*");
  return {passed:results.every(r=>r.passed),results,errors,mockedWrites:writes.length,realWrites:0};
}
