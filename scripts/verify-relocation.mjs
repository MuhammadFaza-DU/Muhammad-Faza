import {createHash} from "node:crypto";
import {readFile,readdir,lstat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const activeOnly=process.argv.includes("--active-only");
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const entries=[];
async function walk(dir,relative="") {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const file=relative?`${relative}/${item.name}`:item.name;
    if(item.isSymbolicLink())throw new Error(`Unexpected symlink ${file}`);
    if(item.isDirectory())await walk(path.join(dir,item.name),file);
    else entries.push([file,sha(await readFile(path.join(dir,item.name)))]);
  }
}
let protectedCount=0;
if(!activeOnly) {
const manifest=JSON.parse(await readFile(path.join(root,"docs/v2/ROOT-RELOCATION.json"),"utf8"));
for(const entry of manifest.entries.filter(entry=>entry.immutable)) {
  const target=path.resolve(root,entry.to);
  if(path.relative(root,target).startsWith(".."))throw new Error("Relocation escapes root");
  if(sha(await readFile(target))!==entry.sha256)throw new Error(`Protected file changed: ${entry.to}`);
  protectedCount++;
}
await walk(path.join(root,"archive/v1"));
entries.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
if(sha(Buffer.from(JSON.stringify(entries)))!==manifest.archiveDigest)throw new Error("Frozen V1 changed");
}
for(const file of ["src/v2","src/app","public/web","next.config.ts","tailwind.config.ts","postcss.config.mjs"]) {
  let exists=false;
  try { await lstat(path.join(root,file)); exists=true; } catch(error) { if(error.code!=="ENOENT")throw error; }
  if(exists)throw new Error(`Legacy path remains active: ${file}`);
}
for(const name of await readdir(path.join(root,"public"))) {
  if(!["media","assets","fonts","licenses","favicon.svg","apple-touch-icon.png","_headers","_redirects"].includes(name))throw new Error(`Unexpected public entry ${name}`);
}
console.log(activeOnly?"Archive checks not requested; verified root-only V2 and public allowlist.":
  `Verified ${protectedCount} immutable relocated files, ${entries.length} frozen V1 files, root-only V2 and public allowlist.`);
