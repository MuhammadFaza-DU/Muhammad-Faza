import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {copy} from "../../src/i18n/index.ts";

test("Hiring has its own complete bilingual collaboration copy without changing the Contact invitation",()=>{
  for(const locale of ["id","en"]){
    const text=copy[locale].hiring;
    assert.equal(typeof text.title,"string");
    assert.equal(typeof text.introduction,"string");
    assert.equal(typeof text.opportunities,"string");
    assert.notEqual(text.title,copy[locale].contact.availability);
    const html=readFileSync(new URL(`../../dist/${locale}/index.html`,import.meta.url),"utf8");
    const panel=html.match(/<div class="hiring-copy"[\s\S]*?<\/ul>/)?.[0]?.replaceAll("&#39;","'");
    assert.ok(panel.includes(text.title));
    assert.ok(panel.includes(text.introduction));
    assert.ok(panel.includes(text.opportunities));
    assert.doesNotMatch(panel,/Email adalah tempat paling langsung|Email is the most direct place/);
    assert.equal(text.roles.length,6);
  }
});
