import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";
import {createCommentsDb} from "./helpers/comments-db.mjs";
const {Response}=globalThis;
const uuid=n=>`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
const item=n=>({id:uuid(n),projectSlug:"gamein",displayName:"Local",body:`Comment ${n}`,
  createdAt:new Date(Date.UTC(2026,10,16,0,Math.floor(n/3))).toISOString()});

test("comment time uses explicit WIB/UTC and correct date/year independent of viewer zone",async()=>{
  const {formatCommentTime}=await loadModule("lib/comment-time.ts");
  assert.equal(formatCommentTime("2026-12-31T18:05:00.000Z","id"),"1 Jan 2027 · 01.05 WIB");
  assert.equal(formatCommentTime("2026-12-31T18:05:00.000Z","en"),"31 Dec 2026 · 18:05 UTC");
  assert.equal(formatCommentTime("2026-11-16T00:00:00.000Z","en"),"16 Nov 2026 · 00:00 UTC");
});

test("ascending SQLite keysets cover45 tied-time rows exactly once and legacy descending stays intact",async t=>{
  const {listComments}=await import("../../services/comments/src/store.ts");
  const {db,sqlite,close}=createCommentsDb();t.after(close);
  const insert=sqlite.prepare("INSERT INTO comments(id,project_slug,display_name,body,created_at,request_id) VALUES(?,?,?,?,?,?)");
  for(let n=1;n<=45;n++){const c=item(n);insert.run(c.id,c.projectSlug,c.displayName,c.body,Date.parse(c.createdAt),uuid(100+n));}
  let cursor=null;const found=[];
  do{
    const page=await listComments(db,"gamein",cursor,"asc");
    assert.ok(page.comments.length<=20);found.push(...page.comments.map(c=>c.id));cursor=page.nextCursor;
  }while(cursor);
  assert.deepEqual(found,Array.from({length:45},(_,i)=>uuid(i+1)));
  assert.equal((await listComments(db,"gamein",null)).comments[0].id,uuid(45));
});

test("ascending merge de-duplicates read/submit races while descending default remains compatible",async()=>{
  const {mergeComments}=await loadModule("lib/project-comments.ts");
  const current=[item(1),item(4)],incoming=[item(4),item(3),item(2)];
  assert.deepEqual(mergeComments(current,incoming,"asc").map(c=>c.id),[1,2,3,4].map(uuid));
  assert.deepEqual(mergeComments(current,incoming).map(c=>c.id),[4,3,2,1].map(uuid));
  assert.deepEqual(current,[item(1),item(4)]);
});

test("chronological reads opt in explicitly and reject an old server silently ignoring the order",async()=>{
  const {readComments}=await loadModule("lib/project-comments-request.ts");let url;
  const fetch=async value=>{url=new URL(value);return Response.json({ok:true,order:"asc",comments:[item(1)],nextCursor:null});};
  assert.ok(await readComments("https://comments.example","gamein",null,{fetch,order:"asc"}));
  assert.equal(url.searchParams.get("order"),"asc");
  assert.equal(await readComments("https://comments.example","gamein",null,{order:"asc",
    fetch:async()=>Response.json({ok:true,comments:[item(1)],nextCursor:null})}),null);
});
