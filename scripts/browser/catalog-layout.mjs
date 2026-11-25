globalThis.checkCatalogLayout = async page => {
  const results=[];
  const check=(caseId,passed,actual)=>results.push({caseId,passed:Boolean(passed),actual});
  for(const locale of ["id","en"]) {
    for(const [width,height] of [[390,844],[768,1000],[1440,1000],[1920,1080],[320,700]]) {
      await page.setViewportSize({width,height});
      await page.goto(`http://127.0.0.1:4321/${locale}/project/`,{waitUntil:"networkidle"});
      await page.waitForTimeout(800);
      const state=await page.evaluate(()=>{
        const list=document.querySelector(".catalog-list");
        const cards=[...document.querySelectorAll(".catalog-list article")];
        const images=cards.map(card=>card.querySelector("img"));
        return {
          count:cards.length,images:images.filter(Boolean).length,
          columns:list?window.getComputedStyle(list).gridTemplateColumns.split(" ").length:0,
          overflow:document.documentElement.scrollWidth-window.innerWidth,
          native:cards.every(card=>card.querySelectorAll("a[href]").length===1&&!card.querySelector("button,input")&&!card.querySelector("a")?.target),
          dimensions:images.every(img=>img&&img.width>0&&img.height>0&&img.getAttribute("width")&&img.getAttribute("height")),
          hrefs:cards.map(card=>card.querySelector("a")?.getAttribute("href")),
          titleClipped:cards.some(card=>{const h=card.querySelector("h2");return h&&h.scrollHeight>h.clientHeight+1;}),
          sticky:[...document.querySelectorAll("[data-catalog-controls]")].some(el=>["fixed","sticky"].includes(window.getComputedStyle(el).position)),
        };
      });
      check(`${locale}/${width} cards and native destinations`,state.count===11&&state.native&&state.hrefs.every(href=>href?.startsWith(`/${locale}/project/`)),state);
      check(`${locale}/${width} thumbnail geometry and layout`,state.images===11&&state.dimensions&&state.overflow<2&&!state.titleClipped&&!state.sticky&&
        (width===390?state.columns===2:width>=1440?state.columns===4:width===320?state.columns===1:state.columns>=2&&state.columns<=3),state);
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.style.fontSize="200%");
  const enlarged=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-window.innerWidth,columns:window.getComputedStyle(document.querySelector(".catalog-list")).gridTemplateColumns.split(" ").length}));
  check("200% text reflows to one column without clipping",enlarged.overflow<2&&enlarged.columns===1,enlarged);
  return {passed:results.every(item=>item.passed),results};
}
