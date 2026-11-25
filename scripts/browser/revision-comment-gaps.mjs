globalThis.checkCommentGaps=async page=>{
  const results=[],errors=[];let reads=0,posts=0;
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  const id=n=>`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
  const make=n=>({id:id(n),projectSlug:"gamein",displayName:`Local ${n}`,body:`LOCAL fixture ${n}`,
    createdAt:new Date(Date.UTC(2026,10,16,0,n)).toISOString()});
  let records=Array.from({length:45},(_,i)=>make(i+1));
  await page.route("**/project/gamein/",async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace(/data-comments-api(?:="[^"]*")?/,'data-comments-api="https://gaps.test"')
      .replace(/data-comments-sitekey(?:="[^"]*")?/,'data-comments-sitekey="local-test"')});
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*",route=>route.fulfill({
    contentType:"application/javascript",body:`window.turnstile={render:(_,o)=>{window.gapChallenge=o;queueMicrotask(()=>o.callback("local"));return "widget"},
    reset:()=>queueMicrotask(()=>window.gapChallenge.callback("local")),remove:()=>{}};`,
  }));
  await page.route("https://gaps.test/**",async route=>{
    const request=route.request(),url=new URL(request.url()),headers={"access-control-allow-origin":"*","access-control-allow-headers":"Content-Type"};
    if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(request.method()==="GET"){
      reads++;
      const cursor=url.searchParams.get("cursor"),point=cursor?JSON.parse(globalThis.atob(cursor.replaceAll("-","+").replaceAll("_","/"))):null;
      const remaining=records.filter(c=>!point||c.createdAt>point.createdAt||(c.createdAt===point.createdAt&&c.id>point.id));
      const comments=remaining.slice(0,20),last=comments.at(-1);
      const nextCursor=remaining.length>20?globalThis.btoa(JSON.stringify({id:last.id,createdAt:last.createdAt})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,""):null;
      return route.fulfill({headers,json:{ok:true,order:"asc",comments,nextCursor}});
    }
    const input=request.postDataJSON(),number=++posts===1?46:50;
    if(number===50)records.push(...[47,48,49].map(make));
    const comment={...make(number),displayName:input.displayName,body:input.body};records.push(comment);
    return route.fulfill({headers,status:201,json:{ok:true,comment}});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto("http://127.0.0.1:4321/en/project/gamein/",{waitUntil:"networkidle"});
  await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelectorAll("[data-comment-entry]").length===20);
  for(const number of [46,50]){
    await page.locator(".project-comments-form input").fill("Local gaps");
    await page.locator(".project-comments-form textarea").fill(`LOCAL submission ${number}`);
    await page.waitForFunction(()=>Boolean(window.gapChallenge));
    await page.locator(".project-comments-submit").click();
    await page.locator(`[data-comment-entry="${id(number)}"]`).waitFor();
  }
  const tail=await page.locator("[data-comment-entry]").evaluateAll(rows=>rows.slice(-2).map(row=>({
    id:row.dataset.commentEntry,gap:row.previousElementSibling?.hasAttribute("data-comments-gap"),
  })));
  check("each-unverified-submission-interval-marked",tail.every(row=>row.gap),tail);
  const visibleGap=await page.locator("[data-comments-gap]").evaluateAll(nodes=>nodes.map(el=>({
    position:window.getComputedStyle(el).position,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,
  })));
  check("owner-no-visible-gap-prose-or-layout-row",visibleGap.every(el=>el.position==="absolute"&&el.width<=1&&el.height<=1),visibleGap);
  check("no-unbounded-autofetch",reads===1,reads);
  while(await page.locator("[data-comments-more]").isVisible()){
    const previous=await page.locator("[data-comment-entry]").count();
    await page.locator("[data-comments-more]").click();
    await page.waitForFunction(n=>document.querySelectorAll("[data-comment-entry]").length>n,previous);
  }
  const actual=await page.locator("[data-comment-entry]").evaluateAll(rows=>rows.map(row=>row.dataset.commentEntry));
  check("all50-chronological-with-other-visitors",JSON.stringify(actual)===JSON.stringify(Array.from({length:50},(_,i)=>id(i+1))));
  check("gap-markers-removed-after-contiguous-history",await page.locator("[data-comments-gap]").count()===0);
  check("no-page-errors",!errors.length,errors);
  return {passed:results.every(r=>r.passed),results,errors,realPosts:0,mockedPosts:posts};
}
