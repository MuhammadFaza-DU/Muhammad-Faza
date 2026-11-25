import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

test("contact footer keeps the resume without the owner-rejected processing notice in either locale",()=>{
  for(const locale of ["id","en"]){
    const html=readFileSync(new URL(`../../dist/${locale}/contact/index.html`,import.meta.url),"utf8");
    assert.doesNotMatch(html,/Email dan pesan diproses oleh Formspree|Formspree processes your email and message|contact-form-privacy/);
    assert.match(html,/class="text-link contact-resume"/);
    assert.match(html,/data-contact-status[^>]*role="status"/);
  }
});
