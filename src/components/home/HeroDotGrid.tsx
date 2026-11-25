import {useEffect,useState,type ComponentType} from "react";

interface DotGridProps {
  baseColor:string;activeColor:string;dotSize:number;gap:number;
  fade:number;opacity:number;glow:number;dpr:number;intro:boolean;paused:boolean;
}
export default function HeroDotGrid() {
  const [theme,setTheme]=useState<"light"|"dark"|null>(null);
  const [Engine,setEngine]=useState<ComponentType<DotGridProps>|null>(null);
  const [active,setActive]=useState(true);
  useEffect(()=>{
    let alive=true;
    const sync=()=>setTheme(document.documentElement.dataset.theme==="dark"?"dark":"light");
    const dispose=()=>setActive(false);
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    document.addEventListener("astro:before-swap",dispose);
    import("../reference/DotGrid.jsx").then(module=>{if(alive)setEngine(()=>module.default);});
    return ()=>{alive=false;observer.disconnect();document.removeEventListener("astro:before-swap",dispose);};
  },[]);
  return <div className="hero-dot-grid" aria-hidden="true">
    {Engine&&theme&&active&&<Engine baseColor={theme==="dark"?"#414141":"#a0a0a0"}
      activeColor={theme==="dark"?"#b8b8b8":"#333333"} dotSize={5} gap={18}
      fade={.55} opacity={.55} glow={.35} dpr={1.5} intro={true} paused={false}/>}
  </div>;
}
