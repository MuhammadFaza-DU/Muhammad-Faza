globalThis.checkStats = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  await page.clock.install({time:new Date(2027,11,31,23,59,59)});
  await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
  const initial=await page.locator("[data-stats-years]").textContent();
  check("initial/browser-year",initial==="2",initial);
  check("catalog-count",await page.locator("[data-stats-projects]").textContent()==="11");
  check("technology-count",await page.locator("[data-stats-technologies]").textContent()==="18");
  await page.clock.runFor(2200);
  const after=await page.locator("[data-stats-years]").textContent();
  check("open-page/new-year-without-rebuild",after==="3",after);
  const counts=await page.locator(".portfolio-stats").innerText();
  check("en/labels",counts.includes("Projects")&&counts.includes("Years active")&&counts.includes("Technologies"),counts);
  await page.locator(".header-nav a").filter({hasText:"Contact"}).click();
  await page.waitForURL("**/en/contact/");
  await page.locator(".header-nav a").filter({hasText:"Home"}).click();
  await page.waitForURL("**/en/");
  await page.waitForFunction(()=>document.querySelector("[data-stats-years]")?.textContent==="3");
  check("spa/remount-current-year",true);
  await page.goto("http://127.0.0.1:4321/id/",{waitUntil:"networkidle"});
  const translated=await page.locator(".portfolio-stats").innerText();
  check("id/labels",translated.includes("Project")&&translated.includes("Tahun aktif")&&translated.includes("Teknologi"),translated);
  return {results,errors,passed:results.every(r=>r.passed)&&!errors.length};
}
