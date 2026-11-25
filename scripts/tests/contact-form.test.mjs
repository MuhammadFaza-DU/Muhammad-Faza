import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

test("Contact has a native configured Subject/Email/Message form and only resume below it",()=>{
  for(const locale of ["id","en"]) {
    const html=readFileSync(new URL(`../../dist/${locale}/contact/index.html`,import.meta.url),"utf8");
    assert.ok(/<form\b[^>]*action="https:\/\/formspree\.io\/f\/mdegeewb"[^>]*method="post"/.test(html),`${locale}: configured native form missing`);
    for(const field of ["subject","email","message"])assert.ok(html.includes(`name="${field}"`),`${locale}/${field}`);
    assert.doesNotMatch(html,/name="name"|data-copy-email|class="contact-address"/);
    assert.equal((html.match(/class="social-channel"/g)||[]).length,6);
    assert.ok(html.includes('href="/assets/documents/Resume.pdf"'));
    assert.match(html,/name="email"[^>]*autocomplete="email"/);
    assert.match(html,/data-contact-status[^>]*role="status"/);
  }
});

test("contact validation trims edges without collapsing message lines and rejects empty or oversized fields",async()=>{
  const {prepareContactValues}=await import("../../src/lib/contact-form.ts");
  const result=prepareContactValues({subject:"  Hiring discussion  ",email:"  recruiter@example.com  ",message:"  First line\n\nSecond line  "});
  assert.deepEqual(result,{values:{subject:"Hiring discussion",email:"recruiter@example.com",message:"First line\n\nSecond line"},errors:{}});
  assert.deepEqual(prepareContactValues({subject:" \t ",email:" ",message:"\n "}).errors,{subject:"required",email:"required",message:"required"});
  assert.deepEqual(prepareContactValues({subject:"x".repeat(161),email:"x".repeat(255),message:"x".repeat(5001)}).errors,{subject:"tooLong",email:"tooLong",message:"tooLong"});
});

test("only an explicit successful API acknowledgement clears contact input",async()=>{
  const {classifyContactResponse}=await import("../../src/lib/contact-form.ts");
  assert.deepEqual(classifyContactResponse(200,{ok:true}),{kind:"success"});
  for(const [status,body] of [[200,{}],[200,{ok:false}],[500,{ok:true}],[200,"<html>challenge</html>"],[204,null],[400,{errors:"bad"}]])assert.deepEqual(classifyContactResponse(status,body),{kind:"failure"});
  assert.deepEqual(classifyContactResponse(429,{error:"quota"}),{kind:"rate-limit"});
  assert.deepEqual(classifyContactResponse(422,{errors:[{field:"email",message:"untrusted <img>"}]}),{kind:"fields",fields:["email"]});
  assert.deepEqual(classifyContactResponse(422,{errors:[{field:"subject"},{field:"subject"},{field:"unknown"}]}),{kind:"fields",fields:["subject"]});
});
