globalThis.captureFeatured = async page => {
  const captures=[];
  for(const [id,url] of [["gamein","https://gamein-8cq.pages.dev/id/"],["stackcrate","https://stack-crate.vercel.app/"]]) {
    await page.goto(url,{waitUntil:"networkidle"});
    for(const [variant,width,height] of [["wide",1600,1000],["tall",600,1100]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(()=>window.scrollTo(0,0));
      const path=`assets/masters/project-screens/${id}-${variant}.png`;
      await page.screenshot({path,animations:"disabled"});
      captures.push({id,url:page.url(),path,width,height});
    }
  }
  return captures;
}
