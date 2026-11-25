globalThis.checkContactForm = async page => {
  const results=[],errors=[],requests=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  const endpoint="https://formspree.io/f/mdegeewb";
  const origin="http://127.0.0.1:4321";
  let scenario="success",release;
  page.on("pageerror",error=>errors.push(error.message));
  await page.context().route("https://formspree.io/**",async route=>{
    const request=route.request();
    requests.push({url:request.url(),method:request.method(),accept:request.headers().accept,body:request.postData()});
    let responseScenario=scenario;
    if(scenario==="held")responseScenario=await new Promise(resolve=>{release=resolve;});
    if(responseScenario==="network"){await route.abort();return;}
    const status=responseScenario==="fields"?422:responseScenario==="quota"?429:responseScenario==="server"?500:200;
    const body=responseScenario==="fields"?JSON.stringify({errors:[{field:"email",message:"<script>untrusted error</script>"}]}):
      responseScenario==="malformed"?"<html>challenge</html>":JSON.stringify({ok:responseScenario==="success"});
    await route.fulfill({status,contentType:responseScenario==="malformed"?"text/html":"application/json",
      headers:{"access-control-allow-origin":"*"},body}).catch(()=>{});
  });
  const form=()=>page.locator("[data-contact-form]");
  const button=()=>form().locator('button[type="submit"]');
  const ready=()=>page.waitForSelector('[data-contact-form][data-contact-enhanced="true"]');
  const feedbackVisible=()=>page.locator("[data-contact-status]").evaluate(el=>
    !!el.textContent&&el.clientWidth>1&&el.clientHeight>1&&window.getComputedStyle(el).clipPath==="none");
  const fill=async()=>{
    await form().locator('[name="subject"]').fill("  Portfolio discussion  ");
    await form().locator('[name="email"]').fill("person@example.com");
    await form().locator('[name="message"]').fill("First line\n\nSecond line");
  };
  const waitState=state=>page.waitForFunction(state=>document.querySelector("[data-contact-form]")?.dataset.contactState===state,state);
  for(const locale of ["id","en"])for(const width of [320,390,768,1440])for(const theme of ["light","dark"]) {
    const id=`${locale}/${width}/${theme}`;
    await page.setViewportSize({width,height:1000});
    await page.goto(`${origin}/${locale}/contact/`,{waitUntil:"networkidle"});await ready();
    if(await page.locator("html").getAttribute("data-theme")!==theme) {
      if(!await page.locator("[data-theme-toggle]").isVisible())await page.locator("[data-preferences-trigger]").click();
      await page.locator("[data-theme-toggle]").click();await page.keyboard.press("Escape");
    }
    const actual=await form().evaluate(el=>({
      action:el.action,method:el.method,names:[...el.querySelectorAll("input,textarea")].map(field=>field.name),
      labels:[...el.querySelectorAll("input,textarea")].every(field=>!!el.querySelector(`label[for="${field.id}"]`)),
      clipped:[...document.querySelectorAll(".contact-page p,.contact-page label,.contact-page h2,.contact-page a")].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.textContent),
      fields:[...el.querySelectorAll("input,textarea,button")].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
    }));
    check(`${id}/configured-fields`,actual.action===endpoint&&actual.method==="post"&&actual.names.join(",")==="subject,email,message"&&actual.labels,actual);
    check(`${id}/responsive`,!actual.clipped.length&&actual.fields.every(field=>field.height>=44)&&await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),actual);
    check(`${id}/left-and-resume-preserved`,await page.locator(".social-channel").count()===6&&await page.locator(".contact-direct a").count()===1&&await page.locator('.contact-direct a[href="/assets/documents/Resume.pdf"]').count()===1);
    if(locale==="id"&&[390,1440].includes(width)) {
      await form().scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>window.getComputedStyle(document.querySelector(".contact-direct")).opacity==="1");
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.screenshot({path:`.superpowers/sdd/2026-11-15-contact-form/contact-${width}-${theme}.png`,fullPage:true});
    }
  }
  for(const locale of ["id","en"]) {
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`${origin}/${locale}/contact/`,{waitUntil:"networkidle"});await ready();
    check(`${locale}/idle-live-region-compact`,await page.locator("[data-contact-status]").evaluate(el=>
      el.getAttribute("role")==="status"&&el.getAttribute("aria-live")==="polite"&&!el.textContent&&
      window.getComputedStyle(el).position==="absolute"&&window.getComputedStyle(el).display!=="none"));
    const before=requests.length;
    await button().click();
    check(`${locale}/empty-no-request`,requests.length===before&&await page.locator("#contact-subject").evaluate(el=>document.activeElement===el));
    await fill();await page.locator("#contact-email").fill("not-an-email");await button().click();
    check(`${locale}/invalid-email-no-request`,requests.length===before&&await page.locator("#contact-email").getAttribute("aria-invalid")==="true");
    await page.locator("#contact-email").fill("person@example.com");
    scenario="held";await button().click();await waitState("submitting");
    check(`${locale}/pending-locked`,await button().isDisabled()&&await form().locator("input,textarea").evaluateAll(fields=>fields.every(field=>field.readOnly))&&await feedbackVisible());
    await form().evaluate(el=>el.requestSubmit());
    check(`${locale}/no-duplicate-request`,requests.length===before+1);
    release("success");await waitState("success");
    check(`${locale}/ack-clears`,await form().locator("input,textarea").evaluateAll(fields=>fields.every(field=>field.value===""))&&!await button().isDisabled()&&await feedbackVisible());
    const request=requests.at(-1);
    check(`${locale}/actual-payload`,request.url===endpoint&&request.method==="POST"&&request.accept==="application/json"&&
      request.body.includes('name="subject"\r\n\r\nPortfolio discussion\r\n')&&request.body.includes('name="email"')&&
      request.body.includes('name="message"')&&!request.body.includes('name="name"'),request);
    for(const mode of ["fields","quota","server","malformed","network"]) {
      scenario=mode;await fill();await button().click();await waitState(mode==="network"?"unconfirmed":"error");
      check(`${locale}/${mode}/preserves-values`,await page.locator("#contact-subject").inputValue()==="  Portfolio discussion  "&&await page.locator("#contact-message").inputValue()==="First line\n\nSecond line");
      check(`${locale}/${mode}/recoverable-feedback`,!await button().isDisabled()&&await feedbackVisible()&&!await form().locator("script").count());
      if(mode==="fields")check(`${locale}/server-error-localized`,await page.locator("#contact-email-error").isVisible()&&!(await form().innerText()).includes("untrusted error"));
    }
    scenario="success";await fill();await button().click();await waitState("success");
    check(`${locale}/retry-after-error`,!await button().isDisabled());
  }
  scenario="held";
  await page.clock.install();
  await fill();await button().click();await waitState("submitting");
  await page.clock.runFor(20_100);await waitState("unconfirmed");
  check("timeout/no-false-success",await page.locator("#contact-message").inputValue()==="First line\n\nSecond line"&&!await button().isDisabled());
  release("success");
  await page.clock.resume();
  await page.setViewportSize({width:320,height:800});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  check("320-200%/feedback-reflows",await page.locator("[data-contact-status]").evaluate(el=>el.scrollHeight<=el.clientHeight+1)&&await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
  await page.evaluate(()=>document.documentElement.style.removeProperty("font-size"));
  scenario="held";
  await fill();await button().click();await waitState("submitting");
  const pendingCount=requests.length;
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(1).click();await page.waitForURL("**/en/project/");
  release("success");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();await page.waitForURL("**/en/contact/");await ready();
  check("router/aborted-request-cleanup",await form().getAttribute("data-contact-state")==="idle"&&!await button().isDisabled());
  scenario="success";await fill();await button().click();await waitState("success");
  check("router/one-handler-after-remount",requests.length===pendingCount+1);
  await page.emulateMedia({reducedMotion:"reduce"});
  check("reduced/form-operable",await button().isEnabled()&&await form().locator("input,textarea").evaluateAll(fields=>fields.every(field=>!field.readOnly)));
  await page.emulateMedia({reducedMotion:"no-preference"});
  const plainContext=await page.context().browser().newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const plain=await plainContext.newPage();let nativePosts=0;
  await plainContext.route("https://formspree.io/**",async route=>{
    nativePosts++;
    await route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>Intercepted test only</title><p>No real message sent.</p>"});
  });
  await plain.goto(`${origin}/en/contact/`,{waitUntil:"networkidle"});
  await plain.locator("#contact-subject").fill("NoJS test");
  await plain.locator("#contact-email").fill("person@example.com");
  await plain.locator("#contact-message").fill("Intercepted test, no external delivery.");
  await plain.locator(".contact-submit").click();await plain.waitForURL(endpoint);
  check("noJS/native-POST",nativePosts===1&&await plain.locator("title").textContent()==="Intercepted test only");
  await plainContext.close();
  check("no-page-errors",errors.length===0,errors);
  await page.context().unroute("https://formspree.io/**");
  return {passed:results.every(item=>item.passed),results,errors,mockedRequests:requests.length,realSubmissions:0};
}
