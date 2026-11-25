import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const visit={version:1,key:"visit-a",locale:"id",url:"/id/project/?category=tools",scrollY:640,focusedProjectId:"czip",detailPath:"/id/project/czip/"};

test("detail return needs both the exact history ownership token and destination", async () => {
  const {createCatalogSession}=await loadModule("lib/catalog-session.ts");
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const session=createCatalogSession(storage,"http://127.0.0.1:4321");
  session.saveCatalogVisit(visit);
  const restored=createCatalogSession(storage,"http://127.0.0.1:4321");
  assert.deepEqual(restored.catalogReturnForDetail("/id/project/czip/",{fazaCatalogReturn:"visit-a"}),visit);
  assert.equal(restored.catalogReturnForDetail("/id/project/czip/",{}),null);
  assert.equal(restored.catalogReturnForDetail("/id/project/czip/",{fazaCatalogReturn:"stale"}),null);
  assert.equal(restored.catalogReturnForDetail("/id/project/tazk/",{fazaCatalogReturn:"visit-a"}),null);
  assert.equal(restored.catalogReturnForDetail("/en/project/czip/",{fazaCatalogReturn:"visit-a"}),null);
});

test("storage failure falls back to same-document memory without inventing persisted ownership", async () => {
  const {createCatalogSession}=await loadModule("lib/catalog-session.ts");
  const storage={getItem(){throw Error("blocked");},setItem(){throw Error("blocked");},removeItem(){throw Error("blocked");}};
  const session=createCatalogSession(storage,"http://127.0.0.1:4321");
  session.saveCatalogVisit(visit);
  assert.deepEqual(session.catalogReturnForDetail("/id/project/czip/",{fazaCatalogReturn:"visit-a"}),visit);
  assert.equal(createCatalogSession(storage,"http://127.0.0.1:4321").catalogReturnForDetail("/id/project/czip/",{fazaCatalogReturn:"visit-a"}),null);
});
