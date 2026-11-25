import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("DotGrid only schedules frames when visible, foreground, unpaused and context-ready",async()=>{
  const {canRunDotGrid}=await loadModule("lib/dot-grid-policy.ts");
  const active={visible:true,hidden:false,paused:false,contextLost:false};
  assert.equal(canRunDotGrid(active),true);
  for(const state of [
    {...active,visible:false},{...active,hidden:true},
    {...active,paused:true},{...active,contextLost:true},
  ])assert.equal(canRunDotGrid(state),false);
  assert.equal(canRunDotGrid({...active,hidden:false,visible:true}),true);
});
