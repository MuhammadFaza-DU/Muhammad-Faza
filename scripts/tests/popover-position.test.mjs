import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("anchored popup fits viewport and prefers above when below is crowded",async()=>{
  const {placePopover}=await loadModule("lib/popover-position.ts");
  const viewport={left:0,top:80,width:800,height:520};
  for(const anchor of [{left:0,top:85,width:56,height:56},{left:770,top:560,width:56,height:56}]) {
    const point=placePopover(anchor,{width:300,height:180},viewport);
    assert.ok(point.left>=8&&point.left+300<=792);
    assert.ok(point.top>=88&&point.top+180<=592);
  }
  assert.ok(placePopover({left:300,top:540,width:64,height:64},{width:300,height:180},viewport).top<540);
});
