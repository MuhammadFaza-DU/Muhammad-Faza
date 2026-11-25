import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import test from "node:test";

function boot({home=true}={}) {
  const code=readFileSync(new URL("../../src/client/opening-bootstrap.js",import.meta.url),"utf8");
  const events=new globalThis.EventTarget(),root={dataset:{pageKind:home?"home":"contact"}};
  const timers=[];
  const portrait={dataset:{ready:"false",reduced:"false"}};
  const document={
    documentElement:root,body:null,
    addEventListener:events.addEventListener.bind(events),
    removeEventListener:events.removeEventListener.bind(events),
    dispatchEvent:events.dispatchEvent.bind(events),
    querySelectorAll:()=>[],querySelector:selector=>selector===".lanyard-portrait"?portrait:null,
  };
  const window={Event:globalThis.Event,Element:class {}};
  const context={document,window,CustomEvent,performance:{now:()=>0},
    setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},
    clearTimeout:()=>{},requestAnimationFrame:callback=>callback(),
  };
  runInNewContext(code,context);
  return {root,events,timers,document,window,context,code,portrait};
}

test("slow opening remains gated after 8 seconds without replacing Lanyard",()=>{
  const app=boot();
  assert.equal(app.root.dataset.opening,"pending");
  for(const timer of [...app.timers])if(timer.delay<=8000)timer.callback();
  assert.equal(app.root.dataset.opening,"pending");
  assert.equal(app.root.dataset.openingSlow,"true");
  assert.notEqual(app.root.dataset.openingChoice,"static");
});
test("a ready hero opens once and late failure cannot restart the introduction",()=>{
  const app=boot();
  app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine"}}));
  assert.equal(app.root.dataset.opening,"releasing");
  assert.equal(app.root.dataset.openingChoice,"engine");
  app.events.dispatchEvent(new CustomEvent("faza:hero-failed"));
  assert.equal(app.root.dataset.opening,"releasing");
});
test("true failure stays recoverable instead of silently dropping effects",()=>{
  const app=boot();
  app.events.dispatchEvent(new CustomEvent("faza:hero-failed"));
  assert.equal(app.root.dataset.opening,"failed");
  assert.notEqual(app.root.dataset.openingChoice,"static");
  app.events.dispatchEvent(new CustomEvent("faza:opening-retry"));
  assert.equal(app.root.dataset.opening,"pending");
  app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine"}}));
  assert.equal(app.root.dataset.opening,"releasing");
});
test("non-Home entry and internal navigation do not start a full loader",()=>{
  const app=boot({home:false});
  assert.equal(app.root.dataset.opening,undefined);
  app.root.dataset.pageKind="home";
  runInNewContext(app.code,app.context);
  assert.equal(app.root.dataset.opening,undefined);
});
test("hero hydration failure reaches a recoverable failed gate",()=>{
  const app=boot();
  app.events.dispatchEvent(new CustomEvent("astro:hydration-error",{detail:{componentUrl:"/_astro/LanyardPortrait.test.js"}}));
  assert.equal(app.root.dataset.opening,"failed");
  assert.equal(app.root.dataset.openingReload,"true");
});

function arrive(app,pageKind="home"){
  const incoming={dataset:{pageKind}};
  const before=new globalThis.Event("astro:before-swap");
  before.newDocument={documentElement:incoming};
  app.events.dispatchEvent(before);
  const beforeMount={...incoming.dataset};
  app.document.documentElement=incoming;
  app.events.dispatchEvent(new globalThis.Event("astro:after-swap"));
  return {incoming,beforeMount};
}

test("internal Home is guarded before swap without starting MF",()=>{
  const app=boot({home:false});
  const {incoming,beforeMount}=arrive(app);
  assert.equal(beforeMount.homeEntry,"pending");
  assert.equal(incoming.dataset.homeEntry,"pending");
  assert.equal(incoming.dataset.opening,undefined);
  app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine"}}));
  assert.equal(incoming.dataset.homeEntry,"pending","an old ready event cannot expose a new unready portrait");
  app.portrait.dataset.ready="true";
  app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine",portrait:{dataset:{ready:"true"}}}}));
  assert.equal(incoming.dataset.homeEntry,"pending","a previous hero instance cannot release this page");
  app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine",portrait:app.portrait}}));
  assert.equal(incoming.dataset.homeEntry,"releasing");
});

test("internal slow/failure/retry retains its gate and never introduces MF",()=>{
  const app=boot({home:false}),{incoming}=arrive(app);
  for(const timer of [...app.timers])if(timer.delay===8000)timer.callback();
  assert.equal(incoming.dataset.homeEntry,"pending");
  assert.equal(incoming.dataset.homeEntrySlow,"true");
  app.events.dispatchEvent(new CustomEvent("faza:hero-failed"));
  assert.equal(incoming.dataset.homeEntry,"failed");
  app.events.dispatchEvent(new globalThis.Event("faza:opening-retry"));
  assert.equal(incoming.dataset.homeEntry,"pending");
  assert.equal(incoming.dataset.homeEntrySlow,undefined);
  assert.equal(incoming.dataset.opening,undefined);
});

test("repeated route entry releases only the live Home once",()=>{
  const app=boot({home:false});
  let releases=0;
  app.events.addEventListener("faza:opening-release",()=>releases++);
  for(let i=0;i<5;i++){
    const {incoming}=arrive(app);
    app.portrait.dataset.ready="true";
    app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine"}}));
    app.events.dispatchEvent(new CustomEvent("faza:hero-ready",{detail:{kind:"engine"}}));
    assert.equal(incoming.dataset.homeEntry,"releasing");
    arrive(app,"contact");
    app.events.dispatchEvent(new CustomEvent("faza:hero-failed"));
    assert.equal(app.document.documentElement.dataset.homeEntry,undefined);
  }
  assert.equal(releases,5);
});
