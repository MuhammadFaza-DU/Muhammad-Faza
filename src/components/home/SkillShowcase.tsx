import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties,type PointerEvent} from "react";
import type {Locale,SkillRecord} from "../../data/types";
import {copy} from "../../i18n";
import {initialShowcaseState,setGroupPause,selectSkill,dismissSkill,groupIsPaused,advanceMotionTime,type MotionGroup,type GroupPause} from "../../lib/motion-state";
import {skillFeedback} from "../../lib/skill-feedback";
import {projectOrbit,orbitLayout} from "../../lib/orbit";
import ToolOrbit from "./ToolOrbit";
import SkillLoop from "./SkillLoop";
import SkillExplanation from "./SkillExplanation";

export default function SkillShowcase({locale,tools,technologies}:{locale:Locale;tools:SkillRecord[];technologies:SkillRecord[]}) {
  const t=copy[locale].skills;
  const [enhanced,setEnhanced]=useState(false);
  const [state,setState]=useState(initialShowcaseState);
  const [allOpen,setAllOpen]=useState(false);
  const [listVisible,setListVisible]=useState(false);
  const [pointerMotion,setPointerMotion]=useState(false);
  const [selected,setSelected]=useState<SkillRecord|null>(null);
  const [trigger,setTrigger]=useState<HTMLButtonElement|null>(null);
  const [wholeArmor,setWholeArmor]=useState(false);
  const [armorReady,setArmorReady]=useState(false);
  const [armorFailed,setArmorFailed]=useState(false);
  const section=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null),figure=useRef<HTMLDivElement>(null);
  const armor=useRef<HTMLImageElement>(null),track=useRef<HTMLDivElement>(null);
  const listControl=useRef<HTMLButtonElement>(null);
  const list=useRef<HTMLDivElement>(null);
  const listPresentation=useRef<{height:number;opacity:number}|null>(null);
  const restoringFocus=useRef(false),listPointer=useRef(false);
  const selectionEpoch=useRef(0);
  const elapsed=useRef({tool:0,technology:0});
  const toolPaused=groupIsPaused(state,"tool"),technologyPaused=groupIsPaused(state,"technology");
  const reason=(group:MotionGroup,name:keyof GroupPause,value:boolean)=>{
    if(restoringFocus.current&&name==="focus"&&value)return;
    setState(current=>setGroupPause(current,group,name,value));
  };
  useLayoutEffect(()=>{
    const element=list.current;
    if(!element)return;
    if(!listVisible){
      element.style.removeProperty("height");element.style.removeProperty("overflow");
      return;
    }
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!listPointer.current||reduced){
      listPresentation.current=null;element.style.removeProperty("height");element.style.removeProperty("overflow");
      if(!allOpen)setListVisible(false);return;
    }
    const content=element.firstElementChild as HTMLElement;
    const size=content.getBoundingClientRect();
    const ease=getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim();
    const from=listPresentation.current??{height:allOpen?0:element.getBoundingClientRect().height,opacity:allOpen?0:1};
    listPresentation.current=null;
    element.style.height=`${from.height}px`;element.style.overflow="hidden";
    const animation=element.animate([
      {height:`${from.height}px`,opacity:from.opacity},
      {height:`${allOpen?size.height:0}px`,opacity:allOpen?1:0},
    ],{duration:allOpen?240:180,easing:ease,fill:"both"});
    let alive=true;
    const finish=()=>{
      if(!alive)return;
      listPresentation.current=null;
      if(allOpen){
        element.style.removeProperty("height");element.style.removeProperty("overflow");animation.cancel();
      }else setListVisible(false);
    };
    void animation.finished.then(finish).catch(()=>{});
    const observer=new ResizeObserver(()=>{
      const current=content.getBoundingClientRect();
      if(Math.abs(current.width-size.width)>.5||Math.abs(current.height-size.height)>.5)finish();
    });
    observer.observe(content);
    return ()=>{
      alive=false;observer.disconnect();
      if(animation.playState==="running"){
        const current=getComputedStyle(element);
        const height=element.getBoundingClientRect().height;
        listPresentation.current={height,opacity:Number(current.opacity)};
        element.style.height=`${height}px`;
      }
      animation.cancel();
    };
  },[allOpen,listVisible]);
  useEffect(()=>{setEnhanced(true);},[]);
  useEffect(()=>{
    if(!enhanced||!section.current)return;
    const visibility=()=>setState(current=>({...current,documentHidden:document.hidden}));
    const observer=new IntersectionObserver(([entry])=>setState(current=>({...current,offscreen:!entry.isIntersecting})));
    observer.observe(section.current);document.addEventListener("visibilitychange",visibility);visibility();
    const dispose=()=>setState(current=>({...current,offscreen:true}));
    document.addEventListener("astro:before-swap",dispose);
    return ()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);document.removeEventListener("astro:before-swap",dispose);};
  },[enhanced]);
  useEffect(()=>{
    if(!enhanced||!stage.current)return;
    const element=stage.current;
    const buttons=[...element.querySelectorAll<HTMLButtonElement>("[data-orbit-index]")];
    const measure=()=>{
      const layout=orbitLayout(element.clientWidth,element.clientHeight);
      element.style.setProperty("--tool-size",`${layout.hitSize}px`);
      for(const button of buttons) {
        const angle=elapsed.current.tool/36000*Math.PI*2+Number(button.dataset.orbitIndex)*Math.PI*2/tools.length;
        const point=projectOrbit(angle,layout);
        button.style.left="0";button.style.top="0";
        button.style.transform=`translate3d(${point.x-layout.hitSize/2}px,${point.y-layout.hitSize/2}px,0)`;
        button.dataset.depth=point.depth;
        button.querySelector<HTMLElement>(".orbit-tool__face")!.style.transform=`scale(${point.scale})`;
      }
      if(track.current) {
        const span=track.current.scrollWidth/2;
        if(span>0)track.current.style.setProperty("--travel-x",`${-elapsed.current.technology*.028%span}px`);
      }
    };
    measure();
    const observer=new ResizeObserver(measure);observer.observe(element);
    let frame=0,last=0;
    const tick=(now:number)=>{
      const delta=last?Math.min(50,now-last):0;last=now;
      elapsed.current.tool=advanceMotionTime(elapsed.current.tool,delta,toolPaused);
      elapsed.current.technology=advanceMotionTime(elapsed.current.technology,delta,technologyPaused);
      measure();frame=requestAnimationFrame(tick);
    };
    if(!toolPaused||!technologyPaused)frame=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[enhanced,toolPaused,technologyPaused,tools.length]);
  const select=(item:SkillRecord,origin:HTMLButtonElement,pointer:boolean)=>{
    selectionEpoch.current++;
    skillFeedback(origin,pointer);setPointerMotion(pointer);
    setTrigger(origin);setSelected(item);setState(current=>selectSkill(current,{
      id:item.id,group:item.group,source:origin.closest(".all-skills")?"list":"loop",
    }));
  };
  const close=()=>{
    const epoch=++selectionEpoch.current;
    setState(current=>dismissSkill(current));setSelected(null);
    requestAnimationFrame(()=>{
      if(epoch!==selectionEpoch.current)return;
      restoringFocus.current=true;
      const box=trigger?.getBoundingClientRect();
      const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fixed-header-height"))||0;
      if(trigger?.isConnected&&!trigger.closest("[inert],[hidden],[aria-hidden='true']")&&box&&box.bottom>header&&box.top<innerHeight&&box.right>0&&box.left<innerWidth){
        trigger.dataset.skillRestoring="true";trigger.focus({preventScroll:true});delete trigger.dataset.skillRestoring;
      }
      else listControl.current?.focus({preventScroll:true});
      restoringFocus.current=false;
      setState(current=>dismissSkill(current));
    });
  };
  const reveal=(event:PointerEvent<HTMLDivElement>)=>{
    if(!armor.current||!figure.current||!armorReady||wholeArmor||event.pointerType!=="mouse"||!matchMedia("(hover: hover) and (pointer: fine)").matches)return;
    const box=figure.current.getBoundingClientRect();
    armor.current.style.setProperty("--reveal-x",`${event.clientX-box.left}px`);
    armor.current.style.setProperty("--reveal-y",`${event.clientY-box.top}px`);
    armor.current.style.setProperty("--reveal-radius",`${Math.min(box.width*.18,96)}px`);
    armor.current.dataset.local="true";
  };
  return <div ref={section} className="skill-showcase" data-enhanced={enhanced||undefined}
    data-tool-paused={toolPaused} data-technology-paused={technologyPaused}>
    <div className="portrait-stage" ref={stage} data-motion-anchor>
      {enhanced&&<ToolOrbit tools={tools} selected={selected?.id} panelOpen={!!selected}
        onSelect={select} onPause={(name,value)=>reason("tool",name,value)}/>}
      <div className="portrait-figure" ref={figure} data-motion-scroll="character" onPointerMove={reveal} onPointerEnter={reveal}
        onPointerLeave={()=>{if(armor.current)armor.current.dataset.local="false";}}>
        <div className="portrait-visual" data-motion-layer>
        <img className="portrait-normal" src="/media/portrait/normal-768.webp" width={768} height={960} alt="Muhammad Faza" loading="lazy" draggable={false}/>
        {enhanced&&<img ref={armor} className="portrait-armor" src="/media/portrait/armor-768.webp" width={768} height={960}
          alt="" loading="lazy" draggable={false} data-whole={wholeArmor||undefined} style={{"--reveal-radius":"0px"} as CSSProperties}
          onLoad={()=>setArmorReady(true)} onError={()=>setArmorFailed(true)}/>}
        {enhanced&&armorReady&&!armorFailed&&<img className="portrait-armor-whole" src="/media/portrait/armor-768.webp" width={768} height={960}
          alt="" draggable={false} data-whole={wholeArmor||undefined}/>}
        </div>
      </div>
    </div>
    {enhanced?<>
      <div className="showcase-toolbar"><button type="button" className="button button-secondary" disabled={!armorReady||armorFailed}
        aria-pressed={wholeArmor} onClick={()=>{
          if(armor.current)armor.current.dataset.local="false";setWholeArmor(value=>!value);
        }}>{wholeArmor?t.portrait:t.armor}</button></div>
      {armorFailed&&<p role="status">{t.unavailable}</p>}
      <div role="group" aria-label={t.technologies}><SkillLoop items={technologies} trackRef={track}
        selected={selected?.id} panelOpen={!!selected} onSelect={select} onPause={(name,value)=>reason("technology",name,value)}/></div>
      <div className="explanation-controls"><button type="button" className="text-button" ref={listControl} data-motion-owner="skill"
        aria-expanded={allOpen} aria-controls="all-skills" onClick={event=>{
          listPointer.current=event.detail>0;skillFeedback(event.currentTarget,event.detail>0);
          if(!allOpen)setListVisible(true);setAllOpen(value=>!value);
        }}>{allOpen?t.closeAll:t.all}</button></div>
      <div className="all-skills" id="all-skills" ref={list} hidden={!listVisible} inert={!allOpen}><div className="all-skills-content">
        {(["tool","technology"] as const).map(group=><div key={group}><h3>{group==="tool"?t.tools:t.technologies}</h3>
          <div className="all-skill-buttons">{(group==="tool"?tools:technologies).map(item=><button type="button"
            className="button button-secondary" key={item.id} data-skill-group={group} data-skill-id={item.id} data-motion-owner="skill"
            onClick={event=>select(item,event.currentTarget,event.detail>0)} aria-controls="skill-explanation"
            aria-expanded={selected?.id===item.id}>{item.name}</button>)}</div></div>)}
      </div></div>
      <SkillExplanation selected={selected} locale={locale} trigger={trigger} onClose={close} closeLabel={t.close} pointerMotion={pointerMotion}/>
    </>:<details className="static-skill-list"><summary>{t.all}</summary>
      {[...tools,...technologies].map(item=><div key={item.id}><h3>{item.name}</h3><p>{item.description[locale]}</p></div>)}
    </details>}
  </div>;
}
