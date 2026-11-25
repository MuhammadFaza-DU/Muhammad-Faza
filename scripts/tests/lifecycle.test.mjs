import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("page registry mounts once, preserves cancelled navigation and reinitializes after swap",async()=>{
  const {createEnhancementRegistry}=await loadModule("lib/lifecycle.ts");
  const registry=createEnhancementRegistry();
  const target=new globalThis.EventTarget();
  let mounts=0,disposals=0,clicks=0;
  const register=()=>registry.register("button",()=>{
    mounts++;
    const onClick=()=>clicks++;
    target.addEventListener("click",onClick);
    return()=>{disposals++;target.removeEventListener("click",onClick);};
  });
  const context={locale:"en",page:"home",pathname:"/en/"};
  register();
  registry.activate(context);
  registry.activate(context);
  assert.equal(mounts,1);
  target.dispatchEvent(new globalThis.Event("astro:before-preparation"));
  target.dispatchEvent(new globalThis.Event("click"));
  assert.equal(clicks,1);
  registry.dispose();
  registry.activate({...context,page:"contact",pathname:"/en/contact/"});
  target.dispatchEvent(new globalThis.Event("click"));
  assert.deepEqual({mounts,disposals,clicks},{mounts:2,disposals:1,clicks:2});
  const unregister=register();
  assert.equal(mounts,2,"duplicate module registration must not mount twice");
  unregister();
  registry.dispose();
  assert.equal(disposals,2);
});
