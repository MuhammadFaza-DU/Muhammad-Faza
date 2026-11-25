import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

export const visit = { version:1, key:"visit-a", locale:"id", url:"/id/project/?q=C%2B%2B&category=tools",
  scrollY:640, focusedProjectId:"czip", detailPath:"/id/project/czip/" };

test("catalog query roundtrips raw text and rejects unknown categories without interpreting HTML", async () => {
  const { readCatalogState, writeCatalogSearch } = await loadModule("lib/catalog-state.ts");
  assert.deepEqual(readCatalogState("?q=C%2B%2B&category=tools"), {query:"C++",category:"tools"});
  assert.deepEqual(readCatalogState("?q=%3Cimg%3E&category=invalid"), {query:"<img>",category:"all"});
  assert.equal(writeCatalogSearch({query:"",category:"all"}), "");
  assert.equal(writeCatalogSearch({query:"  日本語  ",category:"app"}), "?q=++%E6%97%A5%E6%9C%AC%E8%AA%9E++&category=app");
});

test("catalog return validation rejects foreign, mismatched and corrupt destinations", async () => {
  const { readCatalogVisit } = await loadModule("lib/catalog-state.ts");
  const origin="http://127.0.0.1:4321";
  assert.deepEqual(readCatalogVisit(visit,"id",origin),visit);
  for (const change of [
    {url:"https://evil.example/id/project/"}, {url:"/id/project/czip/"},
    {url:"/en/project/"}, {version:2}, {scrollY:-1}, {scrollY:Infinity},
    {detailPath:"/en/project/czip/"}, {detailPath:"https://evil.example/"}, {key:""},
  ]) assert.equal(readCatalogVisit({...visit,...change},"id",origin),null,JSON.stringify(change));
  for (const value of [null,{},false,"invalid"]) assert.equal(readCatalogVisit(value,"id",origin),null);
});
