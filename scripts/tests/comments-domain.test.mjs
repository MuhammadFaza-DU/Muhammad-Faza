import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

const requestId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input={displayName:" Faza ",body:" Baris pertama\r\nBaris kedua ",requestId,token:"valid-token"};
const record=(id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")=>({
  id,projectSlug:"gamein",displayName:"Faza",body:"Komentar utuh\n<script>literal</script>",
  createdAt:"2026-11-16T03:00:00.000Z",
});

test("comment validation trims edges, preserves lines and strips client privilege fields",async()=>{
  const {validateCommentInput}=await loadModule("lib/project-comments.ts");
  const result=validateCommentInput({...input,id:"forged",projectSlug:"other",createdAt:"forged",admin:true});
  assert.deepEqual(result,{ok:true,value:{displayName:"Faza",body:"Baris pertama\nBaris kedua",requestId,token:"valid-token"}});
});

test("comment limits count UTF-16 units without rejecting valid Unicode or HTML-looking text",async()=>{
  const {validateCommentInput,COMMENT_LIMITS}=await loadModule("lib/project-comments.ts");
  assert.equal(COMMENT_LIMITS.name,60);assert.equal(COMMENT_LIMITS.body,1600);
  assert.equal(COMMENT_LIMITS.page,20);assert.equal(COMMENT_LIMITS.requestBytes,8192);
  assert.equal(COMMENT_LIMITS.rate,6);assert.equal(COMMENT_LIMITS.rateWindowMs,600000);
  assert.equal(validateCommentInput({...input,displayName:"a".repeat(60),body:"x".repeat(1600)}).ok,true);
  assert.equal(validateCommentInput({...input,displayName:"a".repeat(61)}).ok,false);
  assert.equal(validateCommentInput({...input,body:"x".repeat(1601)}).ok,false);
  assert.equal(validateCommentInput({...input,displayName:"🙂".repeat(30),body:"日本語 <img src=x onerror=alert(1)>"}).ok,true);
  assert.equal(validateCommentInput({...input,displayName:"🙂".repeat(31)}).ok,false);
});

test("hostile comment shapes, controls, empty text, invalid UUIDs and oversized tokens are rejected",async()=>{
  const {validateCommentInput}=await loadModule("lib/project-comments.ts");
  for(const value of [null,[],42,"text",{}, {...input,displayName:" \t "},{...input,body:"\n "},
    {...input,displayName:"name\nanother"},{...input,body:"bad\u0000text"},{...input,body:"bad\u0007text"},
    {...input,body:"bad\ud800"},{...input,requestId:"' OR 1=1 --"},{...input,requestId:"not-a-uuid"},
    {...input,token:""},{...input,token:"x".repeat(2049)}]){
    assert.deepEqual(validateCommentInput(value),{ok:false,code:"invalid_input"});
  }
});

test("public page parsing validates project and timestamps and strips private response fields",async()=>{
  const {parseCommentPage}=await loadModule("lib/project-comments.ts");
  const value=record();
  const parsed=parseCommentPage({ok:true,comments:[{...value,abuseKey:"private",requestId,token:"private"}],nextCursor:null},"gamein");
  assert.deepEqual(parsed,{comments:[value],nextCursor:null});
  assert.equal(parseCommentPage({ok:true,comments:[value],nextCursor:null},"tazk"),null);
  assert.equal(parseCommentPage({ok:true,comments:[{...value,createdAt:"yesterday"}],nextCursor:null},"gamein"),null);
  assert.equal(parseCommentPage({ok:true,comments:[{...value,body:""}],nextCursor:null},"gamein"),null);
  assert.equal(parseCommentPage({ok:true,comments:Array(21).fill(value),nextCursor:null},"gamein"),null);
  assert.equal(parseCommentPage({ok:false,comments:[],nextCursor:null},"gamein"),null);
  assert.equal(parseCommentPage({ok:true,comments:[],nextCursor:"x".repeat(257)},"gamein"),null);
});

test("merge keeps every distinct record, de-duplicates IDs and sorts server time then ID without mutating input",async()=>{
  const {mergeComments}=await loadModule("lib/project-comments.ts");
  const first=record(),second=record("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
  const older={...record("dddddddd-dddd-4ddd-8ddd-dddddddddddd"),createdAt:"2026-11-15T03:00:00.000Z"};
  const current=[first,older],incoming=[first,second];
  assert.deepEqual(mergeComments(current,incoming).map(item=>item.id),[second.id,first.id,older.id]);
  assert.deepEqual(current,[first,older]);assert.deepEqual(incoming,[first,second]);
});

test("bounded cursors roundtrip stable timestamp and UUID and reject malformed encodings",async()=>{
  const {encodeCommentCursor,parseCommentCursor}=await loadModule("lib/project-comments.ts");
  const {id,createdAt}=record();
  const cursor=encodeCommentCursor({id,createdAt});
  assert.deepEqual(parseCommentCursor(cursor),{id,createdAt});
  for(const value of [null,[],"", "!", "x".repeat(257),globalThis.btoa('{"id":"fake","createdAt":"tomorrow"}')]){
    assert.equal(parseCommentCursor(value),null);
  }
});
