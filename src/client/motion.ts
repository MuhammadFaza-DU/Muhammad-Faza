import {registerPageEnhancement} from "./lifecycle";
import {advanceReveal,type RevealState} from "../lib/reveal-state";

registerPageEnhancement("content-motion",()=>{
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const root=document.documentElement,ease=getComputedStyle(root).getPropertyValue("--ease-out").trim();
  type Row={target:HTMLElement;anchor:HTMLElement;layers:HTMLElement[];state:RevealState;animations:Animation[]};
  const rows=new Map<HTMLElement,Row>();
  let frame=0,lastY=window.scrollY,direction:"up"|"down"="down",alive=true,pointerHeld=false;
  root.dataset.motionEnabled="true";root.dataset.motionInitialized="true";
  const blocked=()=>["opening","homeEntry"].some(key=>["pending","failed"].includes(root.dataset[key]??""))
    ||root.dataset.routePhase==="leaving"||(root.dataset.routePhase==="entering"&&root.dataset.routeVisible!=="true");
  const input=(row:Row,finished=false)=>{
    const box=row.anchor.getBoundingClientRect();
    return {fullyOutside:box.bottom< -48||box.top>innerHeight+48,
      entered:box.bottom>0&&box.top<innerHeight-16,scrollY:window.scrollY,finished};
  };
  const settle=(row:Row)=>{
    row.animations.forEach(a=>a.cancel());row.animations=[];
    row.state={phase:"settled",lastScrollY:window.scrollY,departed:false};
    row.layers.forEach(el=>{el.dataset.revealState="settled";el.dataset.motionSettled="true";});
  };
  const play=(row:Row)=>{
    row.target.dataset.motionDirection=direction;
    const duration=reduce.matches?420:1000;
    row.animations=row.layers.map((el,index)=>{
      el.dataset.revealState="running";el.dataset.motionSettled="true";
      const spatial=el!==row.anchor&&!reduce.matches&&row.target.dataset.motionScroll!=="orbit";
      const frames:Keyframe[]=reduce.matches?[{opacity:0},{opacity:1}]:
        [{opacity:0,filter:"blur(6px)",...(spatial?{transform:`translateY(${direction==="down"?28:-20}px)`}:{})},
          {opacity:1,filter:"none",...(spatial?{transform:"none"}:{})}];
      const groupDelay=row.target.dataset.motionScroll==="orbit"?80:row.target.dataset.motionScroll==="technology"?160:0;
      const animation=el.animate(frames,{duration,delay:reduce.matches?0:Math.min(240,groupDelay+index*80),
        easing:ease,fill:"backwards"});
      return animation;
    });
    document.dispatchEvent(new CustomEvent("faza:reveal-visible",{detail:{target:row.target}}));
    void Promise.all(row.animations.map(a=>a.finished.catch(()=>{}))).then(()=>{
      if(!alive||row.state.phase!=="running")return;
      row.state=advanceReveal(row.state,input(row,true)).state;
      row.layers.forEach(el=>{el.dataset.revealState="settled";});
      row.animations=[];
    });
  };
  const scan=()=>{
    frame=0;if(blocked())return;
    const nextY=window.scrollY;
    if(Math.abs(nextY-lastY)>.5)direction=nextY>lastY?"down":"up";
    lastY=nextY;
    for(const row of rows.values()){
      if(!row.target.isConnected)continue;
      if(!pointerHeld&&row.target.contains(document.activeElement)){settle(row);continue;}
      const next=advanceReveal(row.state,input(row));row.state=next.state;
      if(next.play)play(row);
    }
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(scan);};
  const collect=()=>{
    if(blocked())return;
    for(const target of document.querySelectorAll<HTMLElement>("[data-motion-scroll],[data-motion-enter]")){
      if(rows.has(target)||target.closest("[data-motion-owner]"))continue;
      if(target.hasAttribute("data-motion-enter")&&target.parentElement?.closest("[data-motion-scroll]"))continue;
      const explicit=[...target.querySelectorAll<HTMLElement>(target.dataset.motionScroll==="orbit"
        ?".orbit-tool__face":":scope > [data-motion-layer],:scope > [data-motion-enter]")];
      const layers=explicit.length?explicit:[target];
      const anchor=target.closest<HTMLElement>("[data-motion-anchor]")
        ??(target.dataset.motionScroll==="technology"?target.parentElement!:target);
      const row:Row={target,anchor,layers,state:{phase:"armed",lastScrollY:window.scrollY,departed:false},animations:[]};
      rows.set(target,row);
      target.dataset.motionSettled="true";
      for(const layer of layers){layer.dataset.motionSettled="true";layer.dataset.revealState="waiting";}
    }
    schedule();
  };
  const mutations=new MutationObserver(collect);
  mutations.observe(document.querySelector("main")??document.body,{childList:true,subtree:true});
  const focus=(event:FocusEvent)=>{
    if(pointerHeld||!(event.target instanceof Element))return;
    for(const row of rows.values())if(row.target.contains(event.target))settle(row);
  };
  const change=()=>{for(const row of rows.values())if(row.state.phase==="running")settle(row);schedule();};
  const pointerDown=()=>{pointerHeld=true;};
  const pointerUp=()=>{pointerHeld=false;schedule();};
  document.addEventListener("pointerdown",pointerDown,true);
  document.addEventListener("pointerup",pointerUp,true);
  document.addEventListener("pointercancel",pointerUp,true);
  window.addEventListener("blur",pointerUp);
  window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",schedule);
  document.addEventListener("focusin",focus);
  document.addEventListener("faza:opening-release",collect);document.addEventListener("faza:route-visible",collect);
  reduce.addEventListener("change",change);collect();
  return ()=>{
    alive=false;cancelAnimationFrame(frame);mutations.disconnect();
    for(const row of rows.values())settle(row);
    window.removeEventListener("scroll",schedule);window.removeEventListener("resize",schedule);
    document.removeEventListener("focusin",focus);
    document.removeEventListener("pointerdown",pointerDown,true);
    document.removeEventListener("pointerup",pointerUp,true);
    document.removeEventListener("pointercancel",pointerUp,true);
    window.removeEventListener("blur",pointerUp);
    document.removeEventListener("faza:opening-release",collect);document.removeEventListener("faza:route-visible",collect);
    reduce.removeEventListener("change",change);
  };
});
