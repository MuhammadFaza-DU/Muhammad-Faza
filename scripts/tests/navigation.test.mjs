import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("localized contact and route contexts never default project/contact to Home",async()=>{
  const {localizedPath,readPageContext,navIndex}=await loadModule("lib/locale.ts");
  assert.equal(localizedPath("id","contact"),"/id/contact/");
  for(const [pathname,page,index] of [["/en/","home",0],["/id/project/","project",1],["/en/project/tazk/","detail",1],["/id/contact/","contact",2]]) {
    const context=readPageContext(pathname);
    assert.equal(context.page,page);
    assert.equal(navIndex(context.page),index);
  }
  assert.equal(readPageContext("/en/project/not-real/"),null);
  assert.equal(readPageContext("/fr/contact/"),null);
});
