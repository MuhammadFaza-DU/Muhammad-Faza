globalThis.checkNavigation = async page => {
  const origin="http://127.0.0.1:4321",results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const check=(caseId,passed,actual)=>results.push({caseId,passed,actual});
  let stage="start";
  try {
  await page.goto(`${origin}/en/project/`,{waitUntil:"networkidle"});
  await page.waitForSelector(".gooey-nav[data-enhanced]");
  await page.evaluate(()=>{window.originalNavCanvas=document.querySelector(".gooey-nav__canvas");});
  const originalCanvas=await page.locator(".gooey-nav__canvas").elementHandle();
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
  await page.waitForURL("**/en/contact/");
  stage="contact-aria";
  await page.waitForFunction(()=>document.querySelector('.gooey-nav__list:not([aria-hidden]) a[aria-current="page"]')?.textContent==="Contact",null,{timeout:5000});
  check("project-contact/persisted-canvas",await page.locator(".gooey-nav__canvas").evaluate((canvas,original)=>canvas===original,originalCanvas));
  const transfer=await page.evaluate(()=>new Promise(resolve=>{
    const samples=[];
    const collect=()=>{
      samples.push({clip:document.querySelector(".gooey-nav__list--active").style.clipPath,current:document.querySelector('.gooey-nav__list:not([aria-hidden]) a[aria-current]')?.textContent});
      if(samples.length<12)requestAnimationFrame(collect);
      else resolve(samples);
    };
    requestAnimationFrame(collect);
  }));
  check("project-contact/visible-transfer",transfer.some(sample=>(sample.clip.match(/M/g)||[]).length>1),transfer.map(sample=>({clipLength:sample.clip.length,current:sample.current})));
  check("project-contact/no-home-reset",transfer.every(sample=>sample.current==="Contact"));
  await page.goBack();
  await page.waitForURL("**/en/project/");
  stage="back-aria";
  await page.waitForFunction(()=>document.querySelector('.gooey-nav__list:not([aria-hidden]) a[aria-current]')?.textContent==="Projects",null,{timeout:5000});
  check("back/project-current",await page.locator('.gooey-nav__list:not([aria-hidden]) a[aria-current]').innerText()==="Projects");
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').first().click();
  await page.waitForURL("**/en/");
  await page.locator("#hire").evaluate(el=>el.scrollIntoView({block:"start"}));
  check("home-scroll/not-contact-current",await page.locator('.gooey-nav__list:not([aria-hidden]) a[aria-current]').innerText()==="Home");
   await page.locator('.hiring-portrait a[href="/en/contact/"]').click();
  await page.waitForURL("**/en/contact/");
   stage="contact-form";
   await page.locator('[data-contact-form][data-contact-enhanced="true"]').waitFor();
   await page.locator('[data-contact-form] button[type="submit"]').click();
   check("home-to-contact/reinitialized-enhancement",await page.locator("#contact-subject").evaluate(el=>
     document.activeElement===el&&!el.validity.valid));
  check("no-extra-canvas",await page.locator(".gooey-nav__canvas").count()===1);
  const noJs=await page.context().browser().newContext({javaScriptEnabled:false});
  const plain=await noJs.newPage();
  await plain.goto(`${origin}/id/contact/`);
  check("no-js/contact-route",await plain.locator("h1").count()===1&&await plain.locator('.gooey-nav__list:not([aria-hidden]) a[aria-current]').innerText()==="Kontak");
  await noJs.close();
  for(const file of ["/assets/masters/portraits/DSC07729.JPG","/archive/v1/package.json","/src/app/page.tsx"]) {
    const response=await page.request.get(`${origin}${file}`);
    check(`private-not-served/${file}`,response.status()===404);
  }
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').first().click();
  await page.waitForURL("**/en/");
  await page.route("**/en/contact/",async route=>{
    await new Promise(resolve=>setTimeout(resolve,200));
    try { await route.continue(); }
    catch(error) {
      // A newer navigation may abort this deliberately delayed request.
      if(!/already handled|aborted|Target.*closed/i.test(error.message)) throw error;
    }
  });
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(2).click();
  await page.locator('.gooey-nav__list:not([aria-hidden]) a').nth(1).click();
  await page.waitForURL("**/en/project/");
  stage="rapid-nav-aria";
  await page.waitForFunction(()=>document.querySelector('.gooey-nav__list:not([aria-hidden]) a[aria-current]')?.textContent==="Projects",null,{timeout:5000});
  check("rapid-delayed-navigation/final-route",true);
  await page.unroute("**/en/contact/");
  } catch(error) {
    check(`navigation/${stage}`,false,{error:error.message,url:page.url(),current:await page.locator('.gooey-nav__list:not([aria-hidden]) a[aria-current]').textContent().catch(()=>null)});
  }
  return {results,errors,passed:results.every(result=>result.passed)&&!errors.length};
}
