import assert from "node:assert/strict";
import test from "node:test";

test("scroll impulses follow signed input and stay bounded",async()=>{
  const {scrollImpulse}=await import("../../src/lib/lanyard-scroll.js");
  const down=scrollImpulse(80,16),up=scrollImpulse(-80,16);
  assert.ok(down.linear>0&&down.angular>0);
  assert.equal(down.linear,-up.linear);assert.equal(down.angular,-up.angular);
  assert.deepEqual(scrollImpulse(0,16),{linear:0,angular:0});
  const extreme=scrollImpulse(100000,16);
  assert.ok(Number.isFinite(extreme.linear)&&Math.abs(extreme.linear)<=1.8);
  assert.ok(Number.isFinite(extreme.angular)&&Math.abs(extreme.angular)<=2.4);
});
test("invalid and stale scroll intervals do not inject momentum",async()=>{
  const {scrollImpulse}=await import("../../src/lib/lanyard-scroll.js");
  for(const [delta,interval] of [[NaN,16],[10,NaN],[100,0],[20,1500],[Infinity,16]]){
    assert.deepEqual(scrollImpulse(delta,interval),{linear:0,angular:0});
  }
});
test("queued background scroll expires and resetting baselines discards old deltas",async()=>{
  const {createScrollInput}=await import("../../src/lib/lanyard-scroll.js");
  const input=createScrollInput(0,0);
  input.queue(10);
  assert.deepEqual(input.consume(80,1500,1000),{linear:0,angular:0});
  input.queue(1510);input.reset(80,1520);
  assert.deepEqual(input.consume(80,1530,1000),{linear:0,angular:0});
  input.queue(2000);
  assert.ok(input.consume(150,2016,1000).angular>0);
});
