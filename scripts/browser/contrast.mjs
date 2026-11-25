globalThis.checkRenderedContrast = async page => {
  const results=[];
  for(const theme of ["light","dark"]) {
    await page.setViewportSize({width:1440,height:1000});
    await page.goto("http://127.0.0.1:4321/en/",{waitUntil:"networkidle"});
    if(await page.locator("html").getAttribute("data-theme")!==theme)await page.locator("[data-theme-toggle]").click();
    await page.locator("#hire").scrollIntoViewIfNeeded();
    await page.waitForSelector(".profile-card__photo");
    await page.mouse.move(0,200);
    const regions=await page.locator(".profile-card__info p").evaluateAll(items=>items.map(el=>{
      const range=document.createRange();range.selectNodeContents(el);
      const rect=range.getBoundingClientRect(),style=window.getComputedStyle(el);
      return {name:el.className,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},color:style.color,
        threshold:parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700)?3:4.5};
    }));
    await page.locator(".profile-card__info").evaluate(el=>el.style.visibility="hidden");
    const png=await page.screenshot();
    const samples=await page.evaluate(async({base64,regions})=>{
      const image=new window.Image();image.src=`data:image/png;base64,${base64}`;await image.decode();
      const canvas=document.createElement("canvas");canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(image,0,0);
      const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      return regions.map(region=>{
        const r=region.rect,data=ctx.getImageData(Math.floor(r.x),Math.floor(r.y),Math.ceil(r.width),Math.ceil(r.height)).data;
        const ink=region.color.match(/[\d.]+/g).slice(0,3).map(Number),inkL=luminance(ink);
        let minRatio=100;
        for(let i=0;i<data.length;i+=4) {
          const light=luminance([data[i],data[i+1],data[i+2]]);
          minRatio=Math.min(minRatio,(Math.max(inkL,light)+.05)/(Math.min(inkL,light)+.05));
        }
        return {name:region.name,threshold:region.threshold,minRatio,passed:minRatio>=region.threshold};
      });
    },{base64:png.toString("base64"),regions});
    await page.locator(".profile-card__info").evaluate(el=>el.style.visibility="");
    await page.screenshot({path:`.superpowers/sdd/2026-11-14-home-revision-root/final-hiring-${theme}.png`});
    results.push(...samples.map(sample=>({...sample,theme})));
  }
  return {results,passed:results.every(item=>item.passed)};
}
