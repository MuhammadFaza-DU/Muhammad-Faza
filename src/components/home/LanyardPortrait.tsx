import { useEffect, useId, useRef, useState, type ComponentType, type RefObject } from "react";
import type { CSSProperties } from "react";
import "../reference/Lanyard.css";

export interface LanyardControls { flip: () => void }
export interface LanyardEngineProps {
  frontImage: string; backImage: string; strapImage: string;
  controlRef: RefObject<LanyardControls | null>;
  onReady: () => void; onFailure: () => void; onRestore: () => void;
  onFaceChange: (back: boolean) => void;
  size?: number; anchor?: string; strapLength?: number; strapWidth?: number;
  cardColor?: string; strapColor?: string; orientation?: string; finish?: string;
  imageFit?: string; cornerRadius?: number; metal?: string; gravity?: number;
  damping?: number; elasticity?: number; breeze?: number; interactive?: boolean;
  intro?: boolean; className?: string; style?: CSSProperties;
}

interface Props { front: string; back: string; strap: string; flipLabel: string; instruction: string; alt: string }
export default function LanyardPortrait({front,back,strap,flipLabel,instruction,alt}: Props) {
  const [Engine,setEngine] = useState<ComponentType<LanyardEngineProps> | null>(null);
  const [ready,setReady] = useState(false);
  const [backFace,setBackFace] = useState(false);
  const [reduced,setReduced] = useState(true);
  const [active,setActive] = useState(true);
  const [hydrated,setHydrated] = useState(false);
  const [generation,setGeneration] = useState(0);
  const [attempt,setAttempt] = useState(0);
  const [engineFailed,setEngineFailed] = useState(false);
  const [failedSources,setFailedSources] = useState<Record<string,boolean>>({});
  const controls = useRef<LanyardControls | null>(null);
  const fallbackImage = useRef<HTMLImageElement>(null);
  const instructionId = useId();
  const requestedFace = backFace ? back : front;
  const alternateFace = backFace ? "/media/brand/mf-white.svg" : "/media/portrait/studio-768.webp";
  const useAlternate = !!failedSources[requestedFace];
  useEffect(() => {
    // SSR image errors can occur before React attaches its error handler.
    if (fallbackImage.current?.complete && !fallbackImage.current.naturalWidth) {
      setFailedSources(current => current[requestedFace] ? current : {...current,[requestedFace]:true});
    }
  },[requestedFace]);
  useEffect(()=>{
    const retry=()=>{setEngineFailed(false);setReady(false);setEngine(null);setGeneration(value=>value+1);setAttempt(value=>value+1);};
    document.addEventListener("faza:opening-retry",retry);
    return ()=>document.removeEventListener("faza:opening-retry",retry);
  },[]);
  useEffect(() => {
    let alive = true;
    setHydrated(true);setActive(true);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(media.matches); setReady(false); setEngineFailed(false);
      // React may batch reduce→normal without unmounting the already-ready engine.
      if (!media.matches) setGeneration(value => value + 1);
    };
    const dispose = () => { setActive(false); setReady(false); };
    sync();
    media.addEventListener("change",sync);
    document.addEventListener("astro:before-swap",dispose);
    import("../reference/Lanyard.jsx").then(module => {
      if (alive) setEngine(() => module.default);
    }).catch(() => {
      if(alive){
        setReady(false);setEngineFailed(true);
        if(!media.matches)document.dispatchEvent(new CustomEvent("faza:hero-failed",{detail:{reload:true}}));
      }
    });
    return () => {
      alive = false;
      media.removeEventListener("change",sync);
      document.removeEventListener("astro:before-swap",dispose);
    };
  },[attempt]);
  useEffect(()=>{
    if(!hydrated)return;
    if(engineFailed&&!reduced){
      document.dispatchEvent(new Event("faza:hero-failed"));return;
    }
    if(!ready&&!reduced)return;
    let alive=true,frame=0;
    const imageReady=reduced&&fallbackImage.current?fallbackImage.current.decode():Promise.resolve();
    void Promise.all([imageReady,document.fonts.ready]).then(()=>{
      if(alive)frame=requestAnimationFrame(()=>{
        if(alive)document.dispatchEvent(new CustomEvent("faza:hero-ready",{
          detail:{kind:ready?"engine":"accessible",portrait:fallbackImage.current?.closest(".lanyard-portrait")},
        }));
      });
    }).catch(()=>{if(alive)document.dispatchEvent(new CustomEvent("faza:hero-failed",{detail:{reload:true}}));});
    return ()=>{alive=false;cancelAnimationFrame(frame);};
  },[ready,reduced,hydrated,engineFailed,attempt,requestedFace,useAlternate]);
  const flip = () => {
    if (!reduced && ready && controls.current) controls.current.flip();
    else setBackFace(value => !value);
  };
  return <div className="lanyard-portrait" data-ready={ready} data-face={backFace ? "back" : "front"} data-reduced={reduced}>
    <div className="lanyard-stage">
      <div className="lanyard-fallback" data-symbol={useAlternate && backFace || undefined}>
        <img ref={fallbackImage} src={useAlternate ? alternateFace : requestedFace} alt={backFace ? "MF" : alt}
          width={useAlternate && backFace ? 1120 : 768} height={useAlternate ? backFace ? 1120 : 960 : 1080} fetchPriority="high"
          onError={() => setFailedSources(current => current[requestedFace] ? current : {...current,[requestedFace]:true})} />
      </div>
      {Engine && !reduced && active && <Engine key={generation} frontImage={front} backImage={back} strapImage={strap}
        controlRef={controls} onReady={() => {setEngineFailed(false);setReady(true);}} onFailure={() => {
          setReady(false);
          if(!matchMedia("(prefers-reduced-motion: reduce)").matches)setEngineFailed(true);
        }}
        onRestore={() => { setReady(false); setGeneration(value => value+1); }}
        onFaceChange={setBackFace} size={.58} strapLength={.24} />}
      <button className="lanyard-flip" type="button" onClick={flip} disabled={!hydrated}
        aria-label={flipLabel} aria-describedby={instructionId} aria-pressed={backFace}></button>
    </div>
    <p id={instructionId} className="sr-only">{instruction}</p>
  </div>;
}
