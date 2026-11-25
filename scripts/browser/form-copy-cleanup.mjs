globalThis.checkFormCopyCleanup=async page=>{
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["id","en"])for(const width of [390,1440])for(const route of ["contact","project/gamein"]){
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:4321/${locale}/${route}/`,{waitUntil:"networkidle"});
    const panel=page.locator(route==="contact"?".contact-form-panel":"[data-project-comments]");
    await panel.scrollIntoViewIfNeeded();
    const text=await panel.innerText();
    results.push({caseId:`${locale}/${width}/${route}/removed-copy`,passed:!text.match(
      /Nama dan komentar akan tampil publik|Cloudflare membantu mencegah spam|Komentar belum bisa dimuat|Your name and comment will be public|Cloudflare helps prevent spam|Comments could not be loaded|Email dan pesan diproses oleh Formspree|Formspree processes your email and message/
    )});
    results.push({caseId:`${locale}/${width}/${route}/reflows`,passed:await panel.evaluate(el=>
      document.documentElement.scrollWidth<=window.innerWidth+1&&el.scrollWidth<=el.clientWidth+1)});
    results.push({caseId:`${locale}/${width}/${route}/feedback-kept`,passed:await panel.locator('[role="status"]').count()>0});
    if(route==="contact")results.push({caseId:`${locale}/${width}/${route}/resume-kept`,passed:await panel.locator('a[href="/assets/documents/Resume.pdf"]').isVisible()});
  }
  results.push({caseId:"no-page-errors",passed:errors.length===0,actual:errors});
  return {passed:results.every(result=>result.passed),results,realPosts:0};
}
