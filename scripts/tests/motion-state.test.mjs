import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("hover/focus and popup ownership affect only their motion group", async () => {
  const {initialShowcaseState:initial,setGroupPause,selectSkill,groupIsPaused}=await loadModule("lib/motion-state.ts");
  const hovered=setGroupPause(initial,"tool","hover",true);
  assert.equal(groupIsPaused(hovered,"tool"),true);
  assert.equal(groupIsPaused(hovered,"technology"),false);
  const focused=setGroupPause(initial,"technology","focus",true);
  assert.equal(groupIsPaused(focused,"technology"),true);
  assert.equal(groupIsPaused(focused,"tool"),false);
  const selected=selectSkill(initial,{id:"vscode",group:"tool"});
  const switched=selectSkill(selected,{id:"python",group:"technology"});
  assert.equal(groupIsPaused(switched,"tool"),false);
  assert.equal(groupIsPaused(switched,"technology"),true);
  const both=selectSkill(hovered,{id:"python",group:"technology"});
  assert.equal(groupIsPaused(selectSkill(both,null),"tool"),true,"Closing popup must preserve actual hover");
  assert.equal(groupIsPaused(selectSkill(both,null),"technology"),false);
  assert.equal(groupIsPaused({...initial,allItemsOpen:true},"tool"),false,"UI chooser isn't a pause reason");
  assert.equal(groupIsPaused({...initial,allItemsOpen:true},"technology"),false);
  assert.equal(initial.groups.tool.hover,false,"Fixtures aren't mutated");
});

test("visibility pause preserves elapsed phase and resumes without hidden-time catch-up", async () => {
  const { advanceMotionTime } = await loadModule("lib/motion-state.ts");
  assert.equal(advanceMotionTime(1000, 20000, true), 1000);
  assert.equal(advanceMotionTime(1000, 16, false), 1016);
});

test("static list explanations do not pause either moving group",async()=>{
  const {initialShowcaseState:initial,selectSkill,groupIsPaused}=await loadModule("lib/motion-state.ts");
  const next=selectSkill(initial,{id:"python",group:"technology",source:"list"});
  assert.equal(groupIsPaused(next,"tool"),false);
  assert.equal(groupIsPaused(next,"technology"),false);
});

test("dismiss clears interaction pauses without undoing visibility pause",async()=>{
  const {initialShowcaseState:initial,selectSkill,dismissSkill,groupIsPaused,setGroupPause}=await loadModule("lib/motion-state.ts");
  const selected=selectSkill(setGroupPause(setGroupPause(initial,"technology","hover",true),"technology","focus",true),{id:"python",group:"technology"});
  const closed=dismissSkill(selected);
  assert.equal(closed.selection,null);
  assert.equal(groupIsPaused(closed,"technology"),false);
  assert.equal(groupIsPaused(dismissSkill({...selected,offscreen:true}),"technology"),true);
  assert.equal(groupIsPaused(dismissSkill({...selected,documentHidden:true}),"tool"),true);
});
