import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("portfolio statistics derive from the catalog and technology records, including additions",async()=>{
  const {getPortfolioStats}=await loadModule("lib/stats.ts");
  const {projects}=await loadModule("data/projects.ts");
  const {technologies}=await loadModule("data/skills.ts");
  const before=getPortfolioStats(projects,technologies,2026);
  assert.equal(before.projectCount,projects.length);
  assert.equal(before.technologyCount,technologies.length);
  const after=getPortfolioStats([...projects,{id:"new-project"}],[...technologies,{id:"new-technology"}],2026);
  assert.equal(after.projectCount,before.projectCount+1);
  assert.equal(after.technologyCount,before.technologyCount+1);
});

test("active calendar years advance without editing copy or a stored counter",async()=>{
  const {getActiveYears,getPortfolioStats}=await loadModule("lib/stats.ts");
  assert.equal(getActiveYears(2025,2026),1);
  assert.equal(getActiveYears(2025,2027),2);
  assert.equal(getActiveYears(2025,2028),3);
  assert.equal(getActiveYears(2025,2024),0);
  assert.equal(getPortfolioStats([],[],2028).yearsActive,3);
  assert.deepEqual(getPortfolioStats([],[],2025),{projectCount:0,technologyCount:0,yearsActive:0});
});
