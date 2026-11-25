import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import test from "node:test";
const {Response}=globalThis;
const load=async()=>{
  const path=new URL("../../src/lib/project-comments-request.ts",import.meta.url);
  assert.ok(existsSync(path),"Comments request helper not implemented");return import(path.href);
};
const comment={id:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",projectSlug:"gamein",displayName:"Faza",body:"Full text",createdAt:"2026-11-16T04:00:00.000Z"};
const input={displayName:"Faza",body:"Full text",requestId:comment.id,token:"unit-token"};
test("only durable valid acknowledgement yields success, malformed or wrong-project acknowledgement is unconfirmed",async()=>{
  const {sendComment}=await load();
  const accepted=await sendComment("https://api.example","gamein",input,{fetch:async()=>Response.json({ok:true,comment},{status:201})});
  assert.deepEqual(accepted,{kind:"success",comment});
  for(const value of [{ok:true},{ok:true,comment:{...comment,projectSlug:"tazk"}},{ok:false}]){
    assert.equal((await sendComment("https://api.example","gamein",input,{fetch:async()=>Response.json(value,{status:201})})).kind,"unconfirmed");
  }
});
test("header success followed by body timeout or network loss is unconfirmed and never automatically retried",async()=>{
  const {sendComment}=await load();let attempts=0;
  const result=await sendComment("https://api.example","gamein",input,{timeoutMs:15,fetch:async()=>{
    attempts++;return {ok:true,status:201,json:()=>new Promise(()=>{})};
  }});
  assert.equal(result.kind,"unconfirmed");assert.equal(attempts,1);
  assert.equal((await sendComment("https://api.example","gamein",input,{fetch:async()=>{throw new Error("offline");}})).kind,"unconfirmed");
});
test("safe server rejection preserves error code and failed reads never become empty pages",async()=>{
  const {sendComment,readComments}=await load();
  const rejected=await sendComment("https://api.example","gamein",input,{fetch:async()=>Response.json({ok:false,error:{code:"rate_limited"}},{status:429})});
  assert.deepEqual(rejected,{kind:"error",code:"rate_limited"});
  const failed=await readComments("https://api.example","gamein",null,{fetch:async()=>Response.json({ok:false},{status:503})});
  assert.equal(failed,null);
  const empty=await readComments("https://api.example","gamein",null,{fetch:async()=>Response.json({ok:true,comments:[],nextCursor:null})});
  assert.deepEqual(empty,{comments:[],nextCursor:null});
});
