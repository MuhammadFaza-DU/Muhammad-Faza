globalThis.checkLanyardCardControl = async page => {
  const results=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const frames=async(count=3)=>page.evaluate(count=>new Promise(resolve=>{
    let n=0;const tick=()=>++n===count?resolve():requestAnimationFrame(tick);tick();
  }),count);
  for(const locale of ["id","en"])for(const mode of ["no-preference","reduce"]) {
    await page.emulateMedia({reducedMotion:mode});
    await page.goto(`http://127.0.0.1:4321/${locale}/`,{waitUntil:"networkidle"});
    await page.evaluate(()=>window.scrollTo(0,0));
    if(mode==="no-preference") {
      await page.waitForSelector('.lanyard-portrait[data-ready="true"]');
      await frames(90);
    }
    const shape=await page.locator(".lanyard-portrait").evaluate(root=>{
      const stage=root.querySelector(".lanyard-stage").getBoundingClientRect();
      const button=root.querySelector(".lanyard-flip"),box=button.getBoundingClientRect();
      return {extraHeight:root.getBoundingClientRect().height-stage.height,
        inside:box.top>=stage.top&&box.bottom<=stage.bottom,
        transparent:window.getComputedStyle(button).backgroundColor==="rgba(0, 0, 0, 0)",
        noSeparateRow:!root.querySelector(".lanyard-controls")};
    });
    results.push({caseId:`${locale}/${mode}/no-separate-button`,actual:shape,
      passed:Math.abs(shape.extraHeight)<=1&&shape.inside&&shape.transparent&&shape.noSeparateRow});
    let point=null;
    if(mode==="reduce") {
      const box=await page.locator(".lanyard-fallback img").boundingBox();
      point={x:box.x+box.width/2,y:box.y+box.height/2};
    }else{
      const canvas=page.locator(".lanyard-canvas"),box=await canvas.boundingBox();
      for(let y=box.y+box.height*.3;y<box.y+box.height*.8&&!point;y+=22)
        for(let x=box.x+box.width*.25;x<box.x+box.width*.75;x+=22){
          await page.mouse.move(x,y);
          if(await canvas.evaluate(el=>el.style.cursor==="grab")){point={x,y};break;}
        }
    }
    if(point)await page.mouse.click(point.x,point.y);
    await frames();
    const afterPointer=await page.locator(".lanyard-portrait").getAttribute("data-face");
    results.push({caseId:`${locale}/${mode}/click-card`,passed:!!point&&afterPointer==="back"});
    const control=page.locator(".lanyard-flip");
    await control.focus();await page.keyboard.press("Space");await frames();
    const afterKeyboard=await page.locator(".lanyard-portrait").getAttribute("data-face");
    const ring=await control.evaluate(el=>({width:window.getComputedStyle(el).outlineWidth,offset:window.getComputedStyle(el).outlineOffset}));
    results.push({caseId:`${locale}/${mode}/keyboard`,passed:afterKeyboard!==afterPointer&&parseFloat(ring.width)>=2&&parseFloat(ring.offset)<0,actual:ring});
  }
  return {results,errors,passed:results.every(item=>item.passed)&&!errors.length};
}
