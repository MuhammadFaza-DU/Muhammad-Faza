import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {createHash} from "node:crypto";
import test from "node:test";
import {createCommentsDb} from "./helpers/comments-db.mjs";

const NOW=Date.parse("2026-11-16T04:00:00.000Z");
const uuid=n=>`${n.toString(16).padStart(8,"0")}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
const hash=value=>createHash("sha256").update(value).digest("hex");
const command=(n,overrides={})=>{
  const slug=overrides.slug??"gamein";
  const input={displayName:"Pengunjung",body:`Komentar ${n}\n<script>literal</script>`,requestId:uuid(n+1000),token:`token-${n}`,...overrides.input};
  return {slug,payloadHash:hash(JSON.stringify([slug,input.displayName,input.body])),
    tokenDigest:hash(input.token),abuseKey:hash(`bucket-${n}`),now:NOW,id:uuid(n),...overrides,input};
};
const store=async()=>{
  const path=new URL("../../services/comments/src/store.ts",import.meta.url);
  assert.ok(existsSync(path),"Comments store not implemented");
  return import(path.href);
};

test("SQLite store persists real rows and keyset pagination isolates projects with stable same-time ordering",async t=>{
  const {storeSubmission,listComments}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  for(let n=1;n<=21;n++)assert.equal((await storeSubmission(db,command(n))).kind,"created");
  await storeSubmission(db,command(100,{slug:"tazk"}));
  const first=await listComments(db,"gamein",null);
  assert.equal(first.comments.length,20);assert.ok(first.nextCursor);
  assert.equal(first.comments[0].id,uuid(21));assert.equal(first.comments.at(-1).id,uuid(2));
  const second=await listComments(db,"gamein",first.nextCursor);
  assert.deepEqual(second.comments.map(row=>row.id),[uuid(1)]);assert.equal(second.nextCursor,null);
  assert.equal((await listComments(db,"tazk",null)).comments.length,1);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,22);
  await assert.rejects(()=>listComments(db,"gamein","invalid!"),/cursor/i);
});

test("matching request retries return one durable record without consuming another rate slot",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const cmd=command(1);
  assert.equal((await storeSubmission(db,cmd)).kind,"created");
  const retry=await storeSubmission(db,{...cmd,id:uuid(2),tokenDigest:hash("fresh-token")});
  assert.equal(retry.kind,"existing");assert.equal(retry.comment.id,cmd.id);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
  assert.equal(sqlite.prepare("SELECT hits FROM rate_limit_buckets").get().hits,1);
  assert.equal((await storeSubmission(db,{...cmd,payloadHash:hash("different"),input:{...cmd.input,body:"different"}})).kind,"conflict");
});

test("parallel matching requests are idempotent and one token cannot create different submissions",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const cmd=command(1);
  const matching=await Promise.all([storeSubmission(db,cmd),storeSubmission(db,{...cmd,id:uuid(2)})]);
  assert.equal(matching.filter(r=>r.kind==="created").length,1);
  assert.equal(matching.filter(r=>r.kind==="existing").length,1);
  const replayed=await storeSubmission(db,command(3,{tokenDigest:cmd.tokenDigest}));
  assert.equal(replayed.kind,"replayed");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
});

test("concurrent submissions with a shared token and distinct request IDs create at most one record",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const result=await Promise.all(Array.from({length:8},(_,n)=>storeSubmission(db,command(n+1,{tokenDigest:hash("shared")}))));
  assert.equal(result.filter(r=>r.kind==="created").length,1);
  assert.equal(result.filter(r=>r.kind==="replayed").length,7);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
});

test("concurrent rate acceptance caps six writes per window and a later window can accept again",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const abuseKey=hash("one-IP-bucket");
  const result=await Promise.all(Array.from({length:7},(_,n)=>storeSubmission(db,command(n+1,{abuseKey}))));
  assert.equal(result.filter(r=>r.kind==="created").length,6);
  assert.equal(result.filter(r=>r.kind==="limited").length,1);
  assert.equal(sqlite.prepare("SELECT hits FROM rate_limit_buckets").get().hits,6);
  assert.equal((await storeSubmission(db,command(8,{abuseKey,now:NOW+600001}))).kind,"created");
});

test("a failed SQL constraint rolls back comment, receipt and rate mutation together",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  await assert.rejects(()=>storeSubmission(db,command(1,{input:{displayName:""}})));
  for(const table of ["comments","submission_receipts","rate_limit_buckets"]){
    assert.equal(sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n,0);
  }
});

test("permanent active-data deletion retains a short-lived receipt that prevents delayed retry resurrection",async t=>{
  const {storeSubmission,listComments}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const cmd=command(1);await storeSubmission(db,cmd);
  sqlite.prepare("DELETE FROM comments WHERE project_slug=? AND id=?").run(cmd.slug,cmd.id);
  assert.equal((await listComments(db,"gamein",null)).comments.length,0);
  assert.equal((await storeSubmission(db,{...cmd,id:uuid(2)})).kind,"deleted");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
});

test("bound values preserve hostile-looking text and bounded expiry cleanup removes security metadata only",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const cmd=command(1,{input:{displayName:"Robert'); DROP TABLE comments;--",body:"Literal <img src=x onerror=alert(1)>"}});
  await storeSubmission(db,cmd);
  await storeSubmission(db,command(2,{now:NOW+86400001}));
  assert.equal(sqlite.prepare("SELECT body FROM comments WHERE id=?").get(cmd.id).body,cmd.input.body);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM submission_receipts WHERE request_id=?").get(cmd.input.requestId).n,0);
  assert.equal((await storeSubmission(db,{...cmd,id:uuid(3),now:NOW+86400002})).kind,"existing");
});

test("deleting an old comment after receipt expiry protects the original request for 24h from deletion",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const now=Date.now(),cmd=command(1,{now:now-3*86400000});
  await storeSubmission(db,cmd);
  await storeSubmission(db,command(2,{now}));
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM submission_receipts WHERE request_id=?").get(cmd.input.requestId).n,0);
  sqlite.prepare("DELETE FROM comments WHERE id=? AND project_slug=?").run(cmd.id,cmd.slug);
  const retry=await storeSubmission(db,{...cmd,now:now+23*3600000,id:uuid(3),tokenDigest:hash("fresh challenge")});
  assert.equal(retry.kind,"deleted","expired original receipt must not permit resurrection after deletion");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments WHERE request_id=?").get(cmd.input.requestId).n,0);
  const tombstone=sqlite.prepare("SELECT expires_at FROM deletion_tombstones WHERE request_id=?").get(cmd.input.requestId);
  assert.ok(tombstone.expires_at>=now+86400000-1000);
});

test("an in-flight retry that passes its initial lookup cannot race past deletion with a missing receipt",async t=>{
  const {storeSubmission}=await store(),{db,sqlite,close}=createCommentsDb();t.after(close);
  const now=Date.now(),cmd=command(1,{now});
  await storeSubmission(db,cmd);
  sqlite.prepare("DELETE FROM submission_receipts WHERE request_id=?").run(cmd.input.requestId);
  let deleted=false;
  const raced={
    ...db,
    prepare(sql){
      const statement=db.prepare(sql),originalBind=statement.bind.bind(statement);
      statement.bind=(...values)=>{
        const bound=originalBind(...values);
        if(sql==="SELECT * FROM comments WHERE request_id=?"){
          bound.first=async()=>{
            if(!deleted){sqlite.prepare("DELETE FROM comments WHERE id=?").run(cmd.id);deleted=true;}
            return null;
          };
        }
        return bound;
      };
      return statement;
    },
  };
  const result=await storeSubmission(raced,{...cmd,now:now+1,id:uuid(2),tokenDigest:hash("fresh retry")});
  assert.equal(result.kind,"deleted");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
});
