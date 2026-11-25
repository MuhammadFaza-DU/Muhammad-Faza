import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import test from "node:test";
import {createCommentsDb} from "./helpers/comments-db.mjs";
const load=async()=>{
  const path=new URL("../comments-admin.mjs",import.meta.url);
  assert.ok(existsSync(path),"Private comments management not implemented");return import(path.href);
};
const account="45d59e780b7aa28dbc45f6c7246d8e95";
const id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const config={account_id:account,name:"faza-portfolio-comments-v2",d1_databases:[{binding:"DB",database_name:"faza-portfolio-comments-v2",database_id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}]};
test("management refuses unknown accounts/databases, ambiguous or unsafe selectors and missing exact confirmation",async()=>{
  const {planAdminCommand}=await load();
  for(const argv of [
    ["delete","--project","gamein","--id",id],
    ["delete","--project","gamein","--id",id,"--confirm","bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"],
    ["delete","--project","gamein';DROP TABLE comments","--id",id,"--confirm",id],
    ["inspect","--project","gamein","--id","' OR 1=1"],
    ["list","--project","unknown"],["list","--project","gamein","--unexpected","x"],
  ])assert.throws(()=>planAdminCommand(argv,config));
  assert.throws(()=>planAdminCommand(["list","--project","gamein"],{...config,account_id:"other"}));
  assert.throws(()=>planAdminCommand(["list","--project","gamein"],{...config,d1_databases:[{...config.d1_databases[0],database_name:"other"}]}));
});
test("management deletes only the exact confirmed project/ID and verifies active absence and deleted receipt",async t=>{
  const {planAdminCommand,executeAdmin}=await load();
  const {sqlite,close}=createCommentsDb();t.after(close);
  sqlite.prepare("INSERT INTO rate_limit_buckets VALUES(?,0,?)").run("c".repeat(64),Date.now()+600000);
  sqlite.prepare("INSERT INTO submission_receipts VALUES(?,?,?,?,?,?,?,?,?)").run(id,"d".repeat(64),"e".repeat(64),id,"gamein",1000,9999999999999,0,"c".repeat(64));
  sqlite.prepare("INSERT INTO comments VALUES(?,?,?,?,?,?)").run(id,"gamein","LOCAL","LOCAL management fixture",1000,id);
  const execute=async sql=>{
    const result=[];
    for(const statement of sql.split(";").map(s=>s.trim()).filter(Boolean)){
      const prepared=sqlite.prepare(statement);
      if(prepared.columns().length)result.push({results:prepared.all(),success:true});
      else{prepared.run();result.push({results:[],success:true});}
    }
    return result;
  };
  const wrong=planAdminCommand(["delete","--project","tazk","--id",id,"--confirm",id],config);
  assert.equal((await executeAdmin(wrong,execute)).deleted,false);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,1);
  const plan=planAdminCommand(["delete","--project","gamein","--id",id,"--confirm",id],config);
  const result=await executeAdmin(plan,execute);
  assert.equal(result.deleted,true);assert.equal(result.affected,1);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM comments").get().n,0);
  assert.equal(sqlite.prepare("SELECT deleted FROM submission_receipts").get().deleted,1);
  assert.equal((await executeAdmin(plan,execute)).deleted,false);
});

test("private management refuses a successful deletion result with no fresh deletion-protection readback",async()=>{
  const {executeAdmin}=await load();
  await assert.rejects(()=>executeAdmin({action:"delete",slug:"gamein",id},async()=>[
    {success:true,results:[]},{success:true,results:[{affected:1}]},{success:true,results:[{remaining:0}]},{success:true,results:[]},
  ]),/unconfirmed/);
});

test("deletion verification measures its protection from operation start, not delayed response arrival",async t=>{
  const {executeAdmin}=await load();
  const started=Date.now();t.mock.timers.enable({apis:["Date"],now:started});
  const result=await executeAdmin({action:"delete",slug:"gamein",id},async()=>{
    t.mock.timers.tick(10000);
    return [{success:true,results:[{affected:1},{remaining:0},{protected_until:started+86400000-500}]}];
  });
  assert.equal(result.deleted,true);
});
