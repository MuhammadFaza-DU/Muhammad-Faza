import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("Lanyard simulates only when visible, ready and not reduced/hidden",async()=>{
  const {lanyardPolicy}=await loadModule("lib/lanyard-policy.ts");
  const normal={reduced:false,visible:true,documentHidden:false,webglReady:true};
  assert.deepEqual(lanyardPolicy(normal),{autoIntro:true,simulate:true,showFallback:false});
  for(const changed of [{reduced:true},{visible:false},{documentHidden:true},{webglReady:false}]) {
    assert.equal(lanyardPolicy({...normal,...changed}).simulate,false);
  }
  assert.equal(lanyardPolicy({...normal,webglReady:false}).showFallback,true);
  assert.equal(lanyardPolicy({...normal,reduced:true}).showFallback,true);
});

test("hero has eager studio Lanyard fallback, no resume, and one cutout ProfileCard in open hire",()=>{
  const html=readFileSync(new URL("../../dist/id/index.html",import.meta.url),"utf8");
  const intro=/<section id="intro"[\s\S]*?<\/section>/.exec(html)?.[0];
  assert.ok(intro);
  assert.match(intro,/class="[^"]*lanyard-portrait/);
  assert.match(intro,/src="\/media\/lanyard\/front.webp"/);
  assert.match(intro,/fetchpriority="high"/i);
  assert.doesNotMatch(intro,/Resume\.pdf|profile-card__photo/);
  const hiring=/<section id="hire"[\s\S]*?<\/section>/.exec(html)?.[0];
  assert.ok(hiring,"Missing open-hire composition");
  assert.match(hiring,/src="\/media\/portrait\/normal-768.webp"/);
  assert.equal((html.match(/class="profile-card__photo"/g)||[]).length,1);
});
