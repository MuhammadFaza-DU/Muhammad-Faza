(()=>{
  if(window.__fazaDocumentBooted)return;
  window.__fazaDocumentBooted=true;
  let root=null,mode=null,slowTimer,exitTimer;
  const lockedElements=new Set();
  const pending=()=>root&&mode&&root.dataset[mode]==="pending";
  const lock=()=>{
    for(const element of document.querySelectorAll(mode==="opening"?"main,.site-header,.site-footer":"#intro")){
      if(!element.inert){element.inert=true;lockedElements.add(element);}
    }
  };
  const unlock=()=>{
    for(const element of lockedElements)element.inert=false;
    lockedElements.clear();
  };
  const slow=()=>{
    clearTimeout(slowTimer);
    slowTimer=setTimeout(()=>{
      if(pending())root.dataset[mode==="opening"?"openingSlow":"homeEntrySlow"]="true";
    },8000);
  };
  const ready=event=>{
    if(!pending())return;
    if(event.detail?.portrait&&event.detail.portrait!==document.querySelector(".lanyard-portrait"))return;
    if(mode==="homeEntry"){
      const portrait=document.querySelector(".lanyard-portrait");
      if(event.detail?.kind==="engine"&&portrait?.dataset.ready!=="true")return;
      if(event.detail?.kind!=="engine"&&portrait?.dataset.reduced!=="true")return;
    }
    clearTimeout(slowTimer);
    if(mode==="opening")root.dataset.openingChoice=event.detail?.kind==="engine"?"engine":"accessible";
    root.dataset[mode]="releasing";
    unlock();
    document.dispatchEvent(new window.Event("faza:opening-release"));
    const releasedRoot=root,releasedMode=mode;
    exitTimer=setTimeout(()=>{
      if(releasedRoot.dataset[releasedMode]==="releasing")releasedRoot.dataset[releasedMode]="complete";
    },mode==="opening"?550:1100);
  };
  const failed=event=>{
    if(!pending())return;
    clearTimeout(slowTimer);
    if(event?.detail?.reload)root.dataset.openingReload="true";
    root.dataset[mode]="failed";
  };
  const hydrationError=event=>{
    const heroIsland=event.target instanceof window.Element&&event.target.closest(".intro-portrait");
    if(heroIsland||event.detail?.componentUrl?.includes("LanyardPortrait"))
      failed({detail:{reload:true}});
  };
  const retry=()=>{
    if(!root||!mode||root.dataset[mode]!=="failed")return;
    delete root.dataset.openingSlow;delete root.dataset.homeEntrySlow;
    root.dataset[mode]="pending";
    slow();
  };
  const click=event=>{
    if(event.target instanceof window.Element&&event.target.closest("[data-opening-retry]")){
      if(root?.dataset.openingReload==="true")window.location.reload();
      else document.dispatchEvent(new window.Event("faza:opening-retry"));
    }
  };
  const dispose=()=>{
    clearTimeout(slowTimer);clearTimeout(exitTimer);unlock();
    document.removeEventListener("DOMContentLoaded",lock);
    root=null;mode=null;
  };
  const mount=initial=>{
    dispose();
    if(document.documentElement.dataset.pageKind!=="home")return;
    root=document.documentElement;
    mode=initial?"opening":"homeEntry";
    root.dataset[mode]="pending";
    slow();lock();
    if(initial)document.addEventListener("DOMContentLoaded",lock,{once:true});
  };
  document.addEventListener("astro:before-swap",event=>{
    dispose();
    if(event.newDocument?.documentElement.dataset.pageKind==="home")
      event.newDocument.documentElement.dataset.homeEntry="pending";
  });
  document.addEventListener("astro:after-swap",()=>mount(false));
  document.addEventListener("faza:hero-ready",ready);
  document.addEventListener("faza:hero-failed",failed);
  document.addEventListener("faza:opening-retry",retry);
  document.addEventListener("click",click);
  document.addEventListener("astro:hydration-error",hydrationError);
  mount(true);
})();
