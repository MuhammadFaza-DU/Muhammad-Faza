import {useEffect,useRef} from "react";
import type {Locale,SkillRecord} from "../../data/types";
import {placePopover} from "../../lib/popover-position";

export default function SkillExplanation({selected,locale,trigger,onClose,closeLabel,pointerMotion}:{
  selected:SkillRecord|null;locale:Locale;trigger:HTMLButtonElement|null;onClose:()=>void;closeLabel:string;pointerMotion:boolean;
}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const close=useRef(onClose);
  close.current=onClose;
  useEffect(()=>{
    const element=dialog.current;
    if(!element || !selected)return;
    const mobile=matchMedia("(max-width: 47.99rem)");
    let disposed=false,animation:Animation|undefined;
    const position=()=>{
      if(mobile.matches) {element.style.removeProperty("left");element.style.removeProperty("top");element.style.transformOrigin="center";return;}
      const anchor=trigger?.isConnected?trigger.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
      const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"))||0;
      const viewport=window.visualViewport;
      const point=placePopover(anchor,{width:element.offsetWidth,height:element.offsetHeight},
        {left:viewport?.offsetLeft??0,top:Math.max(header,viewport?.offsetTop??0),
          width:viewport?.width??innerWidth,height:Math.max(1,(viewport?.height??innerHeight)-header)});
      element.style.left=`${point.left}px`;element.style.top=`${point.top}px`;
      element.style.transformOrigin=`${Math.min(element.offsetWidth,Math.max(0,anchor.left+anchor.width/2-point.left))}px ${anchor.top<point.top?0:element.offsetHeight}px`;
    };
    const open=()=>{
      if(disposed)return;
      if(element.open)element.close();
      element.dataset.mode=mobile.matches?"modal":"anchored";
      if(mobile.matches)element.showModal();else element.show();
      position();
      animation?.cancel();
      if(pointerMotion){
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        animation=element.animate(reduced?[{opacity:0},{opacity:1}]:[
          {opacity:0,transform:"scale(.96) translateY(4px)"},{opacity:1,transform:"none"},
        ],{duration:240,easing:getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim()});
      }
      element.querySelector<HTMLButtonElement>(".explanation-close")?.focus({preventScroll:true});
    };
    const dismiss=()=>close.current();
    const outside=(event:PointerEvent)=>{
      if(!mobile.matches && event.target instanceof Node && !element.contains(event.target) &&
        !(event.target instanceof Element && event.target.closest(".orbit-tool,.skill-item,.all-skill-buttons button")))dismiss();
    };
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();dismiss();}};
    document.addEventListener("pointerdown",outside);
    document.addEventListener("keydown",key);
    mobile.addEventListener("change",open);
    window.addEventListener("resize",position);
    window.addEventListener("scroll",position,{passive:true});
    window.visualViewport?.addEventListener("resize",position);
    const observer=new ResizeObserver(position);observer.observe(element);
    open();
    return ()=>{
      disposed=true;
      document.removeEventListener("pointerdown",outside);
      document.removeEventListener("keydown",key);
      mobile.removeEventListener("change",open);
      window.removeEventListener("resize",position);
      window.removeEventListener("scroll",position);
      window.visualViewport?.removeEventListener("resize",position);
      animation?.cancel();observer.disconnect();element.close();
    };
  },[selected,trigger,pointerMotion]);
  return <dialog ref={dialog} id="skill-explanation" className="skill-explanation" aria-labelledby="skill-explanation-title"
    onKeyDown={event=>{
      if(event.key==="Tab"&&event.currentTarget.dataset.mode==="modal"){
        // This informational dialog has exactly one interactive control.
        event.preventDefault();
        event.currentTarget.querySelector<HTMLButtonElement>(".explanation-close")?.focus();
      }
    }}
    onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{
      if(event.target===event.currentTarget){
        const box=event.currentTarget.getBoundingClientRect();
        if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();
      }
    }}>
    <button type="button" className="explanation-close" aria-label={closeLabel} onClick={onClose}>×</button>
    {selected&&<><h3 id="skill-explanation-title">{selected.name}</h3><p>{selected.description[locale]}</p></>}
  </dialog>;
}
