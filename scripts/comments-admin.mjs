import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath,pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {projects} from "../src/data/projects.ts";
import {isCommentId} from "../src/lib/project-comments.ts";

const ACCOUNT="45d59e780b7aa28dbc45f6c7246d8e95",NAME="faza-portfolio-comments-v2";
const CONFIG=fileURLToPath(new URL("../services/comments/wrangler.jsonc",import.meta.url));
const WRANGLER=fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js",import.meta.url));
const allowed=new Set(projects.map(project=>project.slug));
export function planAdminCommand(argv,config){
  const [action,...rest]=argv;
  if(!["list","inspect","delete"].includes(action)||rest.length%2)throw new Error("Use list|inspect|delete with --project and exact --id/--confirm where needed.");
  const options={};
  for(let n=0;n<rest.length;n+=2){
    const key=rest[n].replace(/^--/,"");
    if(!rest[n].startsWith("--")||!["project","id","confirm"].includes(key)||options[key])throw new Error("Invalid management option");
    options[key]=rest[n+1];
  }
  const database=config.d1_databases?.find(binding=>binding.binding==="DB");
  if(config.account_id!==ACCOUNT||config.name!==NAME||database?.database_name!==NAME||
    !isCommentId(database?.database_id)||database.database_id==="00000000-0000-4000-8000-000000000000")throw new Error("Dedicated account/database is not provisioned or does not match");
  if(!allowed.has(options.project))throw new Error("Choose an allowlisted exact project slug");
  if(action!=="list"&&!isCommentId(options.id))throw new Error("An exact canonical record UUID is required");
  if(action==="delete"&&options.confirm!==options.id)throw new Error("--confirm must match the owner-requested record ID");
  if(action==="list"&&(options.id||options.confirm))throw new Error("List takes only --project");
  const id=options.id?.toLowerCase(),slug=options.project;
  const select=`SELECT id,project_slug,display_name,body,created_at FROM comments WHERE project_slug='${slug}'`;
  const sql=action==="list"?`${select} ORDER BY created_at DESC,id DESC LIMIT 50;`:
    action==="inspect"?`${select} AND id='${id}';`:
    `DELETE FROM comments WHERE project_slug='${slug}' AND id='${id}';
     SELECT changes() AS affected;
     SELECT count(*) AS remaining FROM comments WHERE project_slug='${slug}' AND id='${id}';
     SELECT expires_at AS protected_until FROM deletion_tombstones WHERE project_slug='${slug}' AND comment_id='${id}';`;
  return {action,slug,id,sql,databaseId:database.database_id};
}
export async function executeAdmin(plan,execute){
  const startedAt=Date.now();
  const result=await execute(plan.sql);
  if(!Array.isArray(result)||result.some(item=>item.success!==true))throw new Error("Management result is unconfirmed");
  if(plan.action!=="delete")return {records:result.flatMap(item=>item.results??[])};
  const rows=result.flatMap(item=>item.results??[]);
  const affected=rows.find(item=>"affected"in item)?.affected,remaining=rows.find(item=>"remaining"in item)?.remaining;
  const tombstones=rows.filter(item=>"protected_until"in item);
  if(![0,1].includes(affected)||remaining!==0||
    (affected===1&&(tombstones.length!==1||tombstones[0].protected_until<startedAt+86400000-2000)))throw new Error("Deletion readback is unconfirmed");
  return {deleted:affected===1,affected,project:plan.slug,id:plan.id,remaining};
}
function cli(args){
  try{
    return JSON.parse(execFileSync(process.execPath,[WRANGLER,...args,"--config",CONFIG,"--json"],{
      encoding:"utf8",stdio:["ignore","pipe","pipe"],maxBuffer:1024*1024,
    }));
  }catch{throw new Error("Wrangler management operation failed; no success is confirmed.");}
}
async function main(){
  const config=JSON.parse(readFileSync(CONFIG,"utf8")),plan=planAdminCommand(process.argv.slice(2),config);
  const auth=cli(["whoami","--account",ACCOUNT]);
  if(!auth.loggedIn||!auth.accounts?.some(account=>account.id===ACCOUNT))throw new Error("Expected authenticated account is unavailable");
  const info=cli(["d1","info",NAME]);
  if(info.uuid!==plan.databaseId&&info.id!==plan.databaseId)throw new Error("Remote database identity mismatch");
  const result=await executeAdmin(plan,sql=>cli(["d1","execute",NAME,"--remote","--command",sql]));
  console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
