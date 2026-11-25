globalThis.checkContactStreamTimeout = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.context().route("https://formspree.io/**",route=>route.abort());
  await page.goto("http://127.0.0.1:4321/en/contact/",{waitUntil:"networkidle"});
  await page.waitForSelector('[data-contact-enhanced="true"]');
  await page.evaluate(()=>{
    const original=window.fetch;
    window.fetch=(url,options)=>{
      if(String(url)!=="https://formspree.io/f/mdegeewb")return original(url,options);
      const body=new window.ReadableStream({
        start(controller) {
          options.signal.addEventListener("abort",()=>{
            controller.error(new window.DOMException("Body read aborted","AbortError"));
          },{once:true});
        },
      });
      return Promise.resolve(new window.Response(body,{status:200,headers:{"content-type":"application/json"}}));
    };
  });
  await page.clock.install();
  await page.locator("#contact-subject").fill("Stream timeout test");
  await page.locator("#contact-email").fill("person@example.com");
  await page.locator("#contact-message").fill("Keep this draft when acknowledgement is interrupted.");
  await page.locator(".contact-submit").click();
  await page.waitForFunction(()=>document.querySelector("[data-contact-form]").dataset.contactState==="submitting");
  await page.clock.runFor(20_100);
  await page.waitForFunction(()=>document.querySelector("[data-contact-form]").dataset.contactState!=="submitting");
  const actual=await page.locator("[data-contact-form]").evaluate(form=>({
    state:form.dataset.contactState,status:form.querySelector("[data-contact-status]").textContent,
    message:form.querySelector('[name="message"]').value,disabled:form.querySelector('button[type="submit"]').disabled,
  }));
  results.push({caseId:"headers-200-stalled-body/timeout-unconfirmed",
    passed:actual.state==="unconfirmed"&&actual.message==="Keep this draft when acknowledgement is interrupted."&&!actual.disabled,actual});
  await page.clock.resume();
  await page.context().unroute("https://formspree.io/**");
  return {passed:results.every(item=>item.passed)&&!errors.length,results,errors,realSubmissions:0};
}
