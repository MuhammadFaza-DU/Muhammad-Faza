import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import test from "node:test";
import {createCommentsDb} from "./helpers/comments-db.mjs";
const {Request,Response}=globalThis;

const ORIGIN="http://127.0.0.1:4321",BASE="https://comments.example/v1/projects";
const uuid=n=>`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
const input=n=>({displayName:"Faza",body:`Uji lokal ${n}`,requestId:uuid(n),token:`token-${n}`});
const load=async()=>{
  const path=new URL("../../services/comments/src/api.ts",import.meta.url);
  assert.ok(existsSync(path),"Comments API not implemented");return import(path.href);
};
const setup=t=>{
  const fixture=createCommentsDb();t.after(fixture.close);
  return {...fixture,env:{DB:fixture.db,TURNSTILE_SECRET:"local-unit-secret",ABUSE_HASH_SALT:"local-unit-salt-with-at-least-32-characters",ALLOWED_ORIGINS:ORIGIN,ALLOWED_HOSTNAMES:"127.0.0.1"}};
};
const request=(method="GET",body,options={})=>{
  const req=new Request(`${BASE}/${options.slug??"gamein"}/comments${options.query??""}`,{
    method,headers:{Origin:ORIGIN,"Content-Type":"application/json","CF-Connecting-IP":"192.0.2.1",...options.headers},
    ...(body!==undefined?{body:typeof body==="string"?body:JSON.stringify(body)}:{}),
  });
  if(options.trusted!==false)Object.defineProperty(req,"cf",{value:{colo:"TEST"}});
  return req;
};
const verify=(patch={})=>async()=>Response.json({success:true,hostname:"127.0.0.1",action:"project_comment",cdata:"gamein",...patch});
const error=async(response,status,code)=>{
  assert.equal(response.status,status);assert.deepEqual(await response.json(),{ok:false,error:{code}});
  assert.equal(response.headers.get("Cache-Control"),"no-store");
};

test("API GET true-empty, OPTIONS explicit CORS and no public mutation/admin routes",async t=>{
  const {handleRequest}=await load(),{env}=setup(t);
  const read=await handleRequest(request(),env);
  assert.deepEqual(await read.json(),{ok:true,comments:[],nextCursor:null});
  assert.equal(read.headers.get("Access-Control-Allow-Origin"),ORIGIN);
  assert.equal((await handleRequest(request("OPTIONS"),env)).status,204);
  for(const method of ["DELETE","PATCH","PUT"])await error(await handleRequest(request(method),env),405,"method_not_allowed");
  await error(await handleRequest(request("GET",undefined,{slug:"not-a-project"}),env),404,"unknown_project");
  await error(await handleRequest(request("GET",undefined,{query:"?cursor=bad!"}),env),400,"invalid_cursor");
  await error(await handleRequest(request("GET",undefined,{query:"?order=invalid"}),env),400,"invalid_order");
  const chronological=await handleRequest(request("GET",undefined,{query:"?order=asc"}),env);
  assert.deepEqual(await chronological.json(),{ok:true,order:"asc",comments:[],nextCursor:null});
});

test("API only acknowledges durable writes and matching retries are idempotent without fresh challenge redemption",async t=>{
  const {handleRequest}=await load(),{env,sqlite}=setup(t);
  let calls=0;
  const fetch=async(...args)=>{calls++;assert.equal(String(args[0]),"https://challenges.cloudflare.com/turnstile/v0/siteverify");return verify()();};
  const created=await handleRequest(request("POST",input(1)),env,{fetch});
  assert.equal(created.status,201);
  const payload=await created.json();assert.equal(payload.ok,true);assert.equal(payload.comment.body,input(1).body);
  assert.deepEqual(Object.keys(payload.comment).sort(),["body","createdAt","displayName","id","projectSlug"]);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
  assert.equal((await handleRequest(request("POST",input(1)),env,{fetch})).status,200);
  assert.equal(calls,1);
  await error(await handleRequest(request("POST",{...input(1),body:"different"}),env,{fetch}),409,"request_conflict");
  const page=await (await handleRequest(request(),env)).json();assert.equal(page.comments[0].id,payload.comment.id);
  assert.equal((await (await handleRequest(request("GET",undefined,{slug:"tazk"}),env)).json()).comments.length,0);
});

test("API blocks invalid bodies, media types, excess bytes and untrusted/foreign origins before persistence",async t=>{
  const {handleRequest}=await load(),{env,sqlite}=setup(t);
  const cases=[
    [request("POST","{"),400,"invalid_input"],[request("POST",null),400,"invalid_input"],
    [request("POST",{...input(1),body:" "}),400,"invalid_input"],
    [request("POST",input(1),{headers:{"Content-Type":"text/plain"}}),415,"unsupported_media_type"],
    [request("POST","x".repeat(8193)),413,"body_too_large"],
    [request("POST",input(1),{headers:{Origin:"https://evil.example"}}),403,"forbidden_origin"],
    [request("POST",input(1),{headers:{Origin:""}}),403,"forbidden_origin"],
    [request("POST",input(1),{trusted:false}),503,"unavailable"],
    [request("POST",input(1),{headers:{"CF-Connecting-IP":"","X-Forwarded-For":"192.0.2.2"}}),503,"unavailable"],
  ];
  for(const [req,status,code]of cases)await error(await handleRequest(req,env,{fetch:verify()}),status,code);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
});

test("API rejects forged action, hostname, project cdata and invalid challenge without storing anything",async t=>{
  const {handleRequest}=await load(),{env,sqlite}=setup(t);
  for(const patch of [{success:false},{action:"other"},{hostname:"evil.example"},{cdata:"tazk"}]){
    await error(await handleRequest(request("POST",input(1)),env,{fetch:verify(patch)}),400,"challenge_failed");
  }
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
});

test("upstream errors, malformed/failed body reads, missing secrets and D1 quota failure are safe unavailable errors",async t=>{
  const {handleRequest}=await load(),{env}=setup(t);
  for(const fetch of [
    async()=>{throw new Error("sensitive upstream");},
    async()=>new Response("secret internal error",{status:503}),
    async()=>new Response("{"),
    async()=>({ok:true,json:async()=>{throw new Error("sensitive body error");}}),
    verify({success:false,"error-codes":["invalid-input-secret"]}),
  ])await error(await handleRequest(request("POST",input(1)),env,{fetch}),503,"unavailable");
  for(const key of ["TURNSTILE_SECRET","ABUSE_HASH_SALT","ALLOWED_HOSTNAMES","ALLOWED_ORIGINS"]){
    await error(await handleRequest(request("POST",input(1)),{...env,[key]:""},{fetch:verify()}),503,"unavailable");
  }
  const DB={prepare(){throw new Error("quota exceeded with SQL and secret");}};
  await error(await handleRequest(request(),{...env,DB}),503,"unavailable");
});

test("Siteverify response-body timeout is bounded and cannot accept a comment",async t=>{
  const {handleRequest}=await load(),{env,sqlite}=setup(t);
  const started=Date.now();
  await error(await handleRequest(request("POST",input(1)),env,{fetch:async()=>({ok:true,json:()=>new Promise(()=>{})})}),503,"unavailable");
  assert.ok(Date.now()-started<10000);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
});

test("API rate limit and concurrent token replay reject writes and deletion cannot be undone by retry",async t=>{
  const {handleRequest}=await load(),{env,sqlite}=setup(t);
  for(let n=1;n<=6;n++)assert.equal((await handleRequest(request("POST",input(n)),env,{fetch:verify()})).status,201);
  const limited=await handleRequest(request("POST",input(7)),env,{fetch:verify()});
  assert.ok(Number(limited.headers.get("Retry-After"))>0);await error(limited,429,"rate_limited");
  const replay=await handleRequest(request("POST",{...input(8),token:input(1).token},{headers:{"CF-Connecting-IP":"192.0.2.3"}}),env,{fetch:verify()});
  await error(replay,400,"challenge_failed");
  sqlite.prepare("DELETE FROM comments WHERE request_id=?").run(uuid(1));
  await error(await handleRequest(request("POST",input(1)),env,{fetch:verify()}),410,"submission_deleted");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,5);
});

test("committed write followed by read failure is unconfirmed end-to-end and unchanged retry recovers the same record",async t=>{
  const {handleRequest}=await load(),{env,sqlite,db}=setup(t);
  const {sendComment}=await import("../../src/lib/project-comments-request.ts");
  let committed=false,attempts=0;
  const faultyDb={
    prepare(sql){
      if(committed)throw new Error("local post-commit read fault");
      return db.prepare(sql);
    },
    async batch(statements){
      const result=await db.batch(statements);committed=true;return result;
    },
  };
  const fetch=async(_url,init)=>{
    attempts++;
    const req=request("POST",JSON.parse(init.body));
    return handleRequest(req,{...env,DB:faultyDb},{fetch:verify()});
  };
  const first=await sendComment("https://api.example","gamein",input(901),{fetch});
  assert.equal(first.kind,"unconfirmed");
  assert.equal(attempts,1,"ambiguous durable write must not automatically retry");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
  const recovered=await sendComment("https://api.example","gamein",input(901),{fetch:async(_url,init)=>
    handleRequest(request("POST",JSON.parse(init.body)),env,{fetch:verify()})});
  assert.equal(recovered.kind,"success");
  assert.equal(sqlite.prepare("SELECT id FROM comments").get().id,recovered.comment.id);
});
