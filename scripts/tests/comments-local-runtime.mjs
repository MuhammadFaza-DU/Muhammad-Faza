import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {resolve} from "node:path";
import {unstable_dev} from "wrangler";
import {sendComment} from "../../src/lib/project-comments-request.ts";

const {Request,URLSearchParams}=globalThis;
const config="services/comments/wrangler.jsonc";
const persist=resolve(process.env.LOCALAPPDATA,"Temp/opencode",`cmt-${randomUUID().slice(0,8)}`);
execFileSync(process.execPath,["node_modules/wrangler/bin/wrangler.js","d1","migrations","apply",
  "faza-portfolio-comments-v2","--local","--config",config,"--persist-to",persist],{stdio:"pipe"});
const worker=await unstable_dev("services/comments/tests/local-worker.ts",{
  config,local:true,ip:"127.0.0.1",port:0,persistTo:persist,logLevel:"error",
  vars:{TURNSTILE_SECRET:"local-only-injected-siteverify",ABUSE_HASH_SALT:"local-only-runtime-salt"},
  experimental:{disableExperimentalWarning:true,disableDevRegistry:true,watch:false,showInteractiveDevSession:false},
});
let checks=0;
try{
  const post=(n,{token=`gamein:${n}`,ip="192.0.2.1",id=randomUUID(),slug="gamein"}={})=>worker.fetch(
    `http://localhost/v1/projects/${slug}/comments`,{
      method:"POST",headers:{Origin:"http://127.0.0.1:4321","Content-Type":"application/json","CF-Connecting-IP":ip},
      body:JSON.stringify({displayName:"LOCAL FIXTURE",body:`Local D1 fixture ${n}`,requestId:id,token}),
    });
  const read=async(slug="gamein")=>(await worker.fetch(`http://localhost/v1/projects/${slug}/comments`)).json();
  assert.equal((await read()).comments.length,0);checks++;
  const id=randomUUID();
  const accepted=await post(1,{id});assert.equal(accepted.status,201);checks++;
  assert.equal((await post(1,{id})).status,200);checks++;
  assert.equal((await post(2,{token:"deny-token"})).status,400);checks++;
  const concurrent=await Promise.all(Array.from({length:6},(_,n)=>post(n+2)));
  assert.equal(concurrent.filter(r=>r.status===201).length,5);checks++;
  assert.equal(concurrent.filter(r=>r.status===429).length,1);checks++;
  assert.equal((await read()).comments.length,6);checks++;
  assert.equal((await read("tazk")).comments.length,0);checks++;
  const replay=await Promise.all(Array.from({length:3},(_,n)=>post(n+20,{token:"gamein:shared",ip:"192.0.2.2"})));
  assert.equal(replay.filter(r=>r.status===201).length,1);checks++;
  assert.equal(replay.filter(r=>r.status===400).length,2);checks++;
  const rolledBack=await (await worker.fetch("http://localhost/__fixture/rollback")).json();
  assert.deepEqual(rolledBack,{receipt:{n:0},rate:{n:0}});checks++;
  const deleted=await (await worker.fetch(`http://localhost/__fixture/delete?requestId=${id}`)).json();
  assert.equal(deleted.changes,3);checks++; // D1 includes the tombstone and receipt trigger writes.
  assert.equal((await post(1,{id})).status,410);checks++;
  assert.equal((await read()).comments.length,6);checks++;
  for(let n=1;n<=21;n++)assert.equal((await post(n,{slug:"tazk",token:`tazk:${n}`,ip:`192.0.2.${n+10}`})).status,201);
  const first=await read("tazk");
  assert.equal(first.comments.length,20);assert.ok(first.nextCursor);checks++;
  const second=await (await worker.fetch(`http://localhost/v1/projects/tazk/comments?cursor=${first.nextCursor}`)).json();
  assert.equal(second.comments.length,1);assert.equal(second.nextCursor,null);checks++;
  const oldRequestId=randomUUID();
  assert.equal((await post(101,{slug:"tazk",token:"tazk:old",ip:"192.0.2.120",id:oldRequestId})).status,201);checks++;
  assert.equal((await (await worker.fetch(`http://localhost/__fixture/expire-receipt?requestId=${oldRequestId}`)).json()).changes,1);checks++;
  assert.equal((await (await worker.fetch(`http://localhost/__fixture/delete?requestId=${oldRequestId}`)).json()).changes,2);checks++;
  assert.equal((await post(101,{slug:"tazk",token:"tazk:fresh-retry",ip:"192.0.2.120",id:oldRequestId})).status,410);checks++;
  const ambiguousInput={displayName:"LOCAL FIXTURE",body:"LOCAL committed then failed ack",requestId:randomUUID(),token:"tazk:postcommit"};
  const asLocalFetch=(fault)=>async(url,init)=>{
    const response=await worker.fetch(url,{...init,headers:{...init.headers,Origin:"http://127.0.0.1:4321","CF-Connecting-IP":"192.0.2.121",
      ...(fault?{"X-Local-Postcommit-Fault":"yes"}:{})}});
    return response;
  };
  const ambiguous=await sendComment("http://localhost","tazk",ambiguousInput,{fetch:asLocalFetch(true)});
  assert.equal(ambiguous.kind,"unconfirmed");checks++;
  const recovered=await sendComment("http://localhost","tazk",ambiguousInput,{fetch:asLocalFetch(false)});
  assert.equal(recovered.kind,"success");checks++;
  const built=await import("../../services/comments/src/index.ts");
  const spoof=new Request("https://comments.example/v1/projects/gamein/comments",{
    method:"POST",headers:{Origin:"http://127.0.0.1:4321","CF-Connecting-IP":"192.0.2.1"},
  });
  assert.equal((await built.default.fetch(spoof,{ALLOWED_ORIGINS:"http://127.0.0.1:4321",TURNSTILE_SECRET:"x",ABUSE_HASH_SALT:"x",ALLOWED_HOSTNAMES:"127.0.0.1"})).status,503);checks++;
  for(let n=200;n<224;n++)assert.equal((await post(n,{slug:"tazk",token:`tazk:${n}`,ip:`192.0.2.${n-150}`})).status,201);
  const ascending=[];let cursor=null;
  do{
    const query=new URLSearchParams({order:"asc"});if(cursor)query.set("cursor",cursor);
    const page=await (await worker.fetch(`http://localhost/v1/projects/tazk/comments?${query}`)).json();
    assert.equal(page.order,"asc");assert.ok(page.comments.length<=20);
    ascending.push(...page.comments);cursor=page.nextCursor;
  }while(cursor);
  assert.equal(ascending.length,46);assert.equal(new Set(ascending.map(c=>c.id)).size,46);
  const sorted=[...ascending].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  assert.deepEqual(ascending.map(c=>c.id),sorted.map(c=>c.id));checks++;
  assert.equal((await read("tazk")).comments[0].id,ascending.at(-1).id);checks++;
  console.log(JSON.stringify({runtime:"actual local Worker/workerd + D1",checks,remoteWrites:0,passed:true}));
}finally{await worker.stop();}
