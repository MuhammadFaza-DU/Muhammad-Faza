import { useRef, type RefObject } from "react";
import type { SkillRecord } from "../../data/types";

export default function SkillLoop({ items, trackRef, selected, panelOpen, onSelect, onPause }: {
  items: SkillRecord[]; trackRef: RefObject<HTMLDivElement | null>;
  selected?: string; panelOpen: boolean; onSelect: (item: SkillRecord,trigger:HTMLButtonElement,pointer:boolean) => void;
  onPause: (reason: "hover" | "focus", value: boolean) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const pointerFocus=useRef(false);
  return <div className="skill-loop" ref={viewport} data-motion-scroll="technology"
    onPointerEnter={event => { if (event.pointerType === "mouse") onPause("hover", true); }}
    onPointerLeave={() => onPause("hover", false)}>
    <div className="skill-loop-track" ref={trackRef}>
      {[false,true].map(clone=><div className="skill-loop-group" key={String(clone)} aria-hidden={clone||undefined}>
        {items.map(item => <button type="button" key={item.id} className="skill-item" data-skill-id={item.id}
          data-motion-owner="skill" tabIndex={clone?-1:undefined}
          onPointerDown={event=>{pointerFocus.current=true;event.preventDefault();}}
          onPointerUp={()=>{pointerFocus.current=false;}}
          onPointerCancel={()=>{pointerFocus.current=false;}}
          aria-expanded={selected === item.id && panelOpen} aria-controls="skill-explanation"
          onFocus={event => {
            if(pointerFocus.current||event.currentTarget.dataset.skillRestoring==="true"){
              if(viewport.current)viewport.current.scrollLeft=0;
              return;
            }
            onPause("focus", true);
            if (!viewport.current || !trackRef.current) return;
            viewport.current.scrollLeft = 0;
            trackRef.current.style.setProperty("--focus-offset", "0px");
            const box = event.currentTarget.getBoundingClientRect();
            const frame = viewport.current.getBoundingClientRect();
            const correction = box.left < frame.left + 8 ? frame.left + 8 - box.left
              : box.right > frame.right - 8 ? frame.right - 8 - box.right : 0;
            trackRef.current.style.setProperty("--focus-offset", `${correction}px`);
          }}
          onBlur={() => {
            onPause("focus", false);
            trackRef.current?.style.setProperty("--focus-offset", "0px");
            if (viewport.current) viewport.current.scrollLeft = 0;
          }}
           onClick={event => onSelect(item,event.currentTarget,event.detail>0)}>{item.name}</button>)}
      </div>)}
    </div>
  </div>;
}
