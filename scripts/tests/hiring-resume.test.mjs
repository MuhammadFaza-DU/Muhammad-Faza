import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import test from "node:test";
import {copy} from "../../src/i18n/index.ts";

test("hiring text panel offers the existing resume while projects and the neighboring card keep their destinations",()=>{
  assert.ok(existsSync(new URL("../../public/assets/documents/Resume.pdf",import.meta.url)));
  for(const locale of ["id","en"]){
    const html=readFileSync(new URL(`../../dist/${locale}/index.html`,import.meta.url),"utf8");
    const section=html.match(/<section id="hire"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section);
    const actions=section.match(/<div class="hiring-actions">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(actions);
    assert.match(actions,/href="\/assets\/documents\/Resume\.pdf"/);
    assert.ok(actions.includes(`>${copy[locale].actions.resume}</a>`));
    assert.ok(actions.includes(`href="/${locale}/project/"`));
    assert.doesNotMatch(actions,new RegExp(`href="/${locale}/contact/"`));
    const card=section.slice(section.indexOf('class="hiring-portrait"'));
    assert.ok(card.includes(`href="/${locale}/contact/"`));
  }
});
