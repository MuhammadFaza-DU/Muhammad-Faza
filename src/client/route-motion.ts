let generation=0,incoming:Animation|null=null,paintFrame=0;
const reduced=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease=()=>getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim();
document.addEventListener("astro:before-preparation",event=>{
  if(event.from.pathname===event.to.pathname&&event.from.search===event.to.search)return;
  const epoch=++generation,main=document.querySelector<HTMLElement>("main");
  if(!main)return;
  incoming?.cancel();cancelAnimationFrame(paintFrame);
  document.documentElement.dataset.routePhase="preparing";
  document.documentElement.dataset.routeVisible="true";
  event.signal.addEventListener("abort",()=>{
    if(epoch===generation){document.documentElement.dataset.routePhase="settled";document.documentElement.dataset.routeVisible="true";}
  },{once:true});
});
document.addEventListener("astro:before-swap",event=>{
  const root=event.newDocument.documentElement;
  root.dataset.motionEnabled="true";root.dataset.routePhase="entering";
  delete root.dataset.routeVisible;
  const main=event.newDocument.querySelector<HTMLElement>("main");
  if(main)main.style.opacity="0";
});
document.addEventListener("astro:after-swap",()=>{
  const epoch=generation,root=document.documentElement,main=document.querySelector<HTMLElement>("main");
  if(!main)return;
  root.dataset.routePhase="entering";
  main.style.removeProperty("opacity");
  incoming=main.animate([{opacity:0},{opacity:1}],{duration:reduced()?420:1000,easing:ease(),fill:"backwards"});
  const animation=incoming;
  const announce=()=>{
    if(epoch!==generation||!main.isConnected)return;
    if(+getComputedStyle(main).opacity>=.08){
      root.dataset.routeVisible="true";
      document.dispatchEvent(new Event("faza:route-visible"));return;
    }
    paintFrame=requestAnimationFrame(announce);
  };
  paintFrame=requestAnimationFrame(announce);
  void animation.finished.catch(()=>{}).then(()=>{
    if(epoch!==generation||incoming!==animation)return;
    root.dataset.routePhase="settled";root.dataset.routeVisible="true";incoming=null;
    document.dispatchEvent(new Event("faza:route-visible"));
  });
});
