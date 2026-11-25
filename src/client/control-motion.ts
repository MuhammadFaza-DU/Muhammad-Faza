import {registerPageEnhancement} from "./lifecycle";

registerPageEnhancement("control-motion",()=>{
  const selector="a[href],button,summary,input[type='checkbox'],input[type='radio']";
  const ownMotion="[inert],[data-motion-owner],.lanyard-portrait,.faza-profile,.gooey-nav,.tool-orbit,.skill-loop";
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const hover=matchMedia("(hover: hover) and (pointer: fine)");
  const ease=getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim();
  const animations=new Map<HTMLElement,Animation>();
  const sheen=document.querySelector<HTMLElement>(".action-sheen");
  let pressed:HTMLElement|null=null,frame=0,pointer:{x:number;y:number}|null=null;
  const target=(event:Event)=>{
    const element=event.target instanceof Element?event.target.closest<HTMLElement>(selector):null;
    return element&&!element.matches(":disabled,[aria-disabled='true']")&&!element.closest(ownMotion)?element:null;
  };
  const animate=(element:HTMLElement,down:boolean)=>{
    const face=element.querySelector<HTMLElement>(".orbit-tool__face")??element;
    const scale=getComputedStyle(face).scale;
    animations.get(face)?.cancel();
    if(reduce.matches)return;
    const primary=element.matches(".intro-actions .button:first-child,.hiring-actions .button:first-child");
    const low=primary?.94:.975;
    const frames:Keyframe[]=down
      ? [{scale:scale==="none"?"1":scale},{scale:String(low)}]
      : [{scale:scale==="none"?String(low):scale},
        ...Array.from({length:25},(_,i)=>{
          const t=(i+1)/25;
          return {scale:String(1-(1-low)*Math.exp(-7*t)*Math.cos(11*t))};
        }),{scale:"1"}];
    const animation=face.animate(frames,{duration:down?120:primary?340:180,easing:down?ease:"linear",fill:down?"forwards":"none"});
    animations.set(face,animation);
    if(!down)void animation.finished.catch(()=>{}).then(()=>{
      if(animations.get(face)===animation)animations.delete(face);
    });
  };
  const down=(event:PointerEvent)=>{
    if(event.button!==0)return;
    pressed=target(event);if(pressed)animate(pressed,true);
  };
  const up=()=>{if(pressed?.isConnected)animate(pressed,false);pressed=null;};
  const cancel=()=>{
    pressed=null;animations.forEach(animation=>animation.cancel());animations.clear();
    if(sheen)sheen.style.opacity="0";
  };
  const draw=()=>{
    frame=0;if(!pointer||reduce.matches||!hover.matches||!sheen)return;
    let chosen:HTMLElement|null=null,power=0;
    for(const button of document.querySelectorAll<HTMLElement>(".button,.social-channel,.footer-socials a")){
      if(button.matches(":disabled")||button.closest(ownMotion))continue;
      const box=button.getBoundingClientRect();
      const dx=Math.max(box.left-pointer.x,0,pointer.x-box.right);
      const dy=Math.max(box.top-pointer.y,0,pointer.y-box.bottom);
      const near=Math.max(0,1-Math.hypot(dx,dy)/60);
      const x=Math.min(box.right-1,Math.max(box.left+1,pointer.x));
      const y=Math.min(box.bottom-1,Math.max(box.top+1,pointer.y));
      const hit=document.elementFromPoint(x,y);
      const visible=near>0&&box.bottom>0&&box.top<window.innerHeight&&hit&&button.contains(hit);
      if(visible&&near>power){chosen=button;power=near;}
    }
    if(!chosen){
      const hit=document.elementFromPoint(pointer.x,pointer.y);
      chosen=hit?.closest<HTMLElement>(selector)??null;
      if(chosen?.closest(ownMotion)||chosen?.matches(":disabled"))chosen=null;
      if(chosen)power=1;
    }
    sheen.style.opacity=chosen?String(power):"0";
    if(chosen){
      const box=chosen.getBoundingClientRect();
      sheen.style.transform=`translate(${box.left}px,${box.top}px)`;
      sheen.style.width=`${box.width}px`;sheen.style.height=`${box.height}px`;
      sheen.style.borderRadius=getComputedStyle(chosen).borderRadius;
      sheen.dataset.inverse=String(chosen.matches(".button:not(.button-secondary)"));
      sheen.style.setProperty("--light-x",`${pointer.x-box.left}px`);
      sheen.style.setProperty("--light-y",`${pointer.y-box.top}px`);
    }
  };
  const move=(event:PointerEvent)=>{
    if(event.pointerType!=="mouse"||!hover.matches)return;
    pointer={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(draw);
  };
  const hideSurface=()=>{pointer=null;if(sheen)sheen.style.opacity="0";};
  const key=(event:KeyboardEvent)=>{
    if(event.key==="Enter"||event.key===" "){
      const element=target(event);if(element)animations.get(element)?.cancel();
    }
  };
  document.addEventListener("pointerdown",down);
  document.addEventListener("pointerup",up);
  document.addEventListener("pointercancel",cancel);
  document.addEventListener("pointermove",move,{passive:true});
  document.addEventListener("pointerleave",cancel);
  document.addEventListener("keydown",key);
  window.addEventListener("blur",cancel);
  window.addEventListener("scroll",hideSurface,{passive:true});
  window.addEventListener("resize",hideSurface);
  reduce.addEventListener("change",cancel);
  return ()=>{
    cancel();cancelAnimationFrame(frame);
    document.removeEventListener("pointerdown",down);
    document.removeEventListener("pointerup",up);
    document.removeEventListener("pointercancel",cancel);
    document.removeEventListener("pointermove",move);
    document.removeEventListener("pointerleave",cancel);
    document.removeEventListener("keydown",key);
    window.removeEventListener("blur",cancel);
    window.removeEventListener("scroll",hideSurface);
    window.removeEventListener("resize",hideSurface);
    reduce.removeEventListener("change",cancel);
  };
});
