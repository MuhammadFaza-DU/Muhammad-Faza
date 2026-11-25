import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("a moving reveal does not rearm from its own geometry at unchanged scroll",async()=>{
  const {advanceReveal}=await loadModule("lib/reveal-state.ts");
  const state={phase:"running",lastScrollY:100,departed:false};
  const next=advanceReveal(state,{fullyOutside:true,entered:false,scrollY:100,finished:false});
  assert.equal(next.state.departed,false);assert.equal(next.play,false);
  const finish=advanceReveal(next.state,{fullyOutside:false,entered:true,scrollY:100,finished:true});
  assert.equal(finish.state.phase,"settled");assert.equal(finish.play,false);
});
test("only real full departure followed by reentry replays once",async()=>{
  const {advanceReveal}=await loadModule("lib/reveal-state.ts");
  const initial={phase:"settled",lastScrollY:100,departed:false};
  const outside=advanceReveal(initial,{fullyOutside:true,entered:false,scrollY:500,finished:false});
  assert.equal(outside.state.phase,"armed");
  const enter=advanceReveal(outside.state,{fullyOutside:false,entered:true,scrollY:200,finished:false});
  assert.equal(enter.play,true);assert.equal(enter.state.phase,"running");
  const duplicate=advanceReveal(enter.state,{fullyOutside:false,entered:true,scrollY:199,finished:false});
  assert.equal(duplicate.play,false);
});
test("an unfinished reveal can record a real departure without restarting midflight",async()=>{
  const {advanceReveal}=await loadModule("lib/reveal-state.ts");
  const moving={phase:"running",lastScrollY:100,departed:false};
  const leave=advanceReveal(moving,{fullyOutside:true,entered:false,scrollY:900,finished:false});
  assert.equal(leave.play,false);assert.equal(leave.state.phase,"running");
  assert.equal(leave.state.departed,true);
  const finish=advanceReveal(leave.state,{fullyOutside:true,entered:false,scrollY:900,finished:true});
  assert.equal(finish.state.phase,"armed");
});
test("a running reveal that reenters before completion cannot leave a deferred replay armed",async()=>{
  const {advanceReveal}=await loadModule("lib/reveal-state.ts");
  const departed={phase:"running",lastScrollY:900,departed:true};
  const completed=advanceReveal(departed,{fullyOutside:false,entered:true,scrollY:200,finished:true});
  assert.equal(completed.state.phase,"settled");
  assert.equal(completed.state.departed,false);
  const tinyScroll=advanceReveal(completed.state,{fullyOutside:false,entered:true,scrollY:201,finished:false});
  assert.equal(tinyScroll.play,false);
});
