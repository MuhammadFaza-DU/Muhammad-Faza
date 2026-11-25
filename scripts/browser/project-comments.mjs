globalThis.checkProjectComments=async page=>{
  const checks=[],errors=[],posts=[];
  const check=(caseId,passed,actual)=>checks.push({caseId,passed:Boolean(passed),actual});
  page.on("pageerror",error=>errors.push(error.message));
  let mode="empty",records=[],nextCursor=null,lateRead;
  const make=(n,projectSlug="gamein",body=`LOCAL INTERCEPT FIXTURE ${n}`)=>({
    id:`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,projectSlug,displayName:`Local ${n}`,body,createdAt:"2026-11-16T04:00:00.000Z",
  });
  await page.route("**/project/*/",async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace(/data-comments-api(?:="[^"]*")?/,'data-comments-api="https://comments.test"')
      .replace(/data-comments-sitekey(?:="[^"]*")?/,'data-comments-sitekey="unit-site-key"')});
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*",route=>route.fulfill({
    contentType:"application/javascript",body:`window.turnstile={
      render:(target,options)=>{window.testChallenge=options;queueMicrotask(()=>options.callback("local-test-token"));return "widget";},
      reset:()=>queueMicrotask(()=>window.testChallenge?.callback("local-test-token")),remove:()=>{}
    };`,
  }));
  await page.route("https://comments.test/**",async route=>{
    const request=route.request(),slug=new URL(request.url()).pathname.split("/")[3];
    const headers={"Access-Control-Allow-Origin":"http://127.0.0.1:4321","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
    if(request.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(request.method()==="GET"){
      if(mode==="read-failure")return route.fulfill({status:503,headers,json:{ok:false,error:{code:"unavailable"}}});
      if(mode==="read-race")await new Promise(resolve=>{lateRead=resolve;});
      return route.fulfill({headers,json:{ok:true,order:"asc",comments:records.filter(item=>item.projectSlug===slug),nextCursor}});
    }
    const input=request.postDataJSON();posts.push({slug,...input});
    if(mode==="write-failure")return route.fulfill({status:429,headers,json:{ok:false,error:{code:"rate_limited"}}});
    if(mode==="postcommit-failure")return route.fulfill({status:503,headers,json:{ok:false,error:{code:"submission_unconfirmed"}}});
    if(mode==="unconfirmed")return route.abort("failed");
    const comment=make(50+posts.length,slug,input.body);comment.displayName=input.displayName;
    records=[comment,...records];return route.fulfill({status:201,headers,json:{ok:true,comment}});
  });
  const go=async(locale="id",slug="gamein")=>{
    await page.goto(`http://127.0.0.1:4321/${locale}/project/${slug}/`,{waitUntil:"domcontentloaded"});
    await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
    await page.locator("[data-project-comments] button[type=submit]:not([disabled])").waitFor();
  };
  for(const locale of ["id","en"])for(const width of [390,768,1440])for(const theme of ["light","dark"]){
    mode="empty";records=[];nextCursor=null;
    await page.setViewportSize({width,height:1000});await go(locale);
    if(await page.locator("html").getAttribute("data-theme")!==theme){
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const panel=page.locator("[data-project-comments]");
    await panel.locator("[data-comments-empty]:not([hidden])").waitFor();
    check(`${locale}/${width}/${theme}/final-copy`,!(await panel.innerText()).match(/simulasi|simulation|pratinjau|local preview/i));
    check(`${locale}/${width}/${theme}/no-public-delete`,await panel.locator("[data-comment-entry] button").count()===0);
    await panel.locator("input").fill("Nama <b>literal</b>");
    const body="Kritik dan apresiasi.\n<script>window.commentExecuted=true</script>";
    await panel.locator("textarea").fill(body);
    await page.waitForFunction(()=>Boolean(window.testChallenge));
    await panel.locator("button[type=submit]").click();
    await panel.locator("[data-comment-entry]").first().waitFor();
    check(`${locale}/${width}/${theme}/durable-success-and-safe-text`,
      await panel.locator("textarea").inputValue()===""&&await panel.locator("[data-comment-message]").first().textContent()===body&&
      await panel.locator("[data-comment-entry] b,[data-comment-entry] script").count()===0);
    check(`${locale}/${width}/${theme}/no-overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
    const contrast=await panel.evaluate(el=>{
      const rgb=value=>value.match(/[\d.]+/g).map(Number);
      const luminance=color=>color.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4)
        .reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
      const ratio=(fg,bg)=>{const a=luminance(rgb(fg)),b=luminance(rgb(bg));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
      return [...el.querySelectorAll("h2,p,label,input,textarea,button,time,strong")].filter(n=>!n.hidden&&!n.disabled).map(n=>{
        let bg="rgb(255,255,255)";
        for(let parent=n;parent;parent=parent.parentElement){const color=window.getComputedStyle(parent).backgroundColor,channels=rgb(color);if(channels.length===3||channels[3]>0){bg=color;break;}}
        return {tag:n.tagName,ratio:ratio(window.getComputedStyle(n).color,bg)};
      });
    });
    check(`${locale}/${width}/${theme}/contrast`,contrast.every(pair=>pair.ratio>=4.5),contrast);
  }
  await page.setViewportSize({width:390,height:900});
  mode="read-failure";records=[];await go();
  await page.getByRole("button",{name:"Coba muat lagi"}).waitFor();
  check("failed-read-not-empty",await page.locator("[data-comments-empty]").isHidden());
  mode="empty";await page.getByRole("button",{name:"Coba muat lagi"}).click();
  await page.locator("[data-comments-empty]:not([hidden])").waitFor();check("manual-read-recovery",true);
  await page.locator("[data-project-comments] input").fill("Local test");
  await page.locator("[data-project-comments] textarea").fill("Unchanged draft");
  mode="write-failure";await page.locator("[data-project-comments] button[type=submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-comments-status]")?.textContent.includes("Terlalu"));
  check("rejection-preserves-draft",await page.locator("[data-project-comments] textarea").inputValue()==="Unchanged draft");
  const firstId=posts.at(-1).requestId,attempts=posts.length;
  mode="postcommit-failure";await page.locator("[data-project-comments] button[type=submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-comments-status]")?.textContent.includes("dipastikan"));
  check("postcommit-unconfirmed-preserves-draft",posts.at(-1).requestId===firstId&&
    await page.locator("[data-project-comments] textarea").inputValue()==="Unchanged draft");
  const afterCommitAttempts=posts.length;
  mode="unconfirmed";await page.locator("[data-project-comments] button[type=submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-comments-status]")?.textContent.includes("dipastikan"));
  check("ambiguous-no-retry-stable-id",posts.length===afterCommitAttempts+1&&attempts<posts.length&&posts.at(-1).requestId===firstId&&
    await page.locator("[data-project-comments] textarea").inputValue()==="Unchanged draft");
  mode="empty";records=[make(1,"gamein","KataPanjang".repeat(140))];await go();
  const geometry=await page.locator("[data-comments-list]").evaluate(el=>({
    cap:el.clientHeight,full:el.scrollHeight,text:el.textContent,overflow:el.scrollWidth>el.clientWidth+1,
  }));
  check("one-long-comment-full-text-bounded",geometry.full>geometry.cap&&geometry.cap<=260&&!geometry.overflow&&geometry.text.includes("KataPanjang".repeat(140)),geometry);
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  check("320-200pct-reflows",await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  mode="read-race";records=[];await go();
  await page.locator("[data-project-comments] input").fill("Local race");
  await page.locator("[data-project-comments] textarea").fill("Accepted while initial read is pending");
  await page.locator("[data-project-comments] button[type=submit]").click();
  await page.locator("[data-comment-entry]").waitFor();
  lateRead?.();mode="empty";await page.waitForTimeout(100);
  check("read-submit-merge-no-duplicate",await page.locator("[data-comment-entry]").count()===1);
  await page.locator("[data-catalog-back]").click();await page.waitForURL("**/id/project/");
  await page.locator('[data-project-id="tazk"] a').click();await page.waitForURL("**/id/project/tazk/");
  await page.locator("[data-project-comments]").scrollIntoViewIfNeeded();
  await page.locator("[data-comments-empty]:not([hidden])").waitFor();
  check("router-project-isolation",await page.locator("[data-comment-entry]").count()===0);
  const nojs=await page.context().browser().newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const plain=await nojs.newPage();await plain.goto("http://127.0.0.1:4321/en/project/gamein/");
    check("noJS-disabled-and-honest",await plain.locator("[data-project-comments] button[type=submit]").isDisabled()&&await plain.locator("noscript").isVisible());
  }finally{await nojs.close();}
  check("no-page-errors",errors.length===0,errors);
  await page.unroute("**/project/*/");await page.unroute("https://comments.test/**");
  await page.unroute("https://challenges.cloudflare.com/turnstile/v0/api.js*");
  return {checks,failed:checks.filter(item=>!item.passed),posts:posts.length,realPosts:0,errors};
}
