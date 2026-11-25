import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const localArchive = {
  skip: !existsSync(path.join(root, "archive/v1")) && "Local archive is not part of the public active-source export",
};

test("active application lives directly in src and public, not beside V1", () => {
  assert.equal(existsSync(path.join(root,"src/pages")),true,"src/pages must be active");
  for (const file of ["src/v2","src/app","public/web","next.config.ts","postcss.config.mjs","tailwind.config.ts"]) {
    assert.equal(existsSync(path.join(root,file)),false,`Legacy/nested active path: ${file}`);
  }
});

test("promoted component/data/lib files are actually covered by ESLint", async () => {
  const eslint = new ESLint({cwd:root});
  for (const file of ["src/components/home/SkillShowcase.tsx","src/data/projects.ts","src/lib/locale.ts"]) {
    assert.equal(await eslint.isPathIgnored(path.join(root,file)),false,`${file} is silently excluded`);
  }
});

test("immutable relocated inputs keep their pre-move hashes", localArchive, () => {
  const file=path.join(root,"docs/v2/ROOT-RELOCATION.json");
  assert.ok(existsSync(file),"Missing relocation manifest");
  const manifest=JSON.parse(readFileSync(file,"utf8"));
  assert.ok(manifest.entries.some(entry=>entry.kind==="v1-source"));
  assert.ok(manifest.entries.some(entry=>entry.kind==="master"));
  for (const entry of manifest.entries.filter(entry=>entry.immutable)) {
    assert.ok(entry.to && existsSync(path.join(root,entry.to)),`Missing protected destination ${entry.to}`);
    assert.equal(sha(readFileSync(path.join(root,entry.to))),entry.sha256,entry.to);
  }
});

test("frozen original V1 snapshot digest remains unchanged", localArchive, () => {
  const entries=[];
  function walk(relative="") {
    for(const item of readdirSync(path.join(root,"archive/v1",relative),{withFileTypes:true})) {
      const file=relative ? `${relative}/${item.name}` : item.name;
      if(item.isDirectory()) walk(file);
      else entries.push([file,sha(readFileSync(path.join(root,"archive/v1",file)))]);
    }
  }
  walk();
  entries.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  assert.equal(entries.length,92);
  assert.equal(sha(Buffer.from(JSON.stringify(entries))),"94775c8c973cac55bf98f007c8327075675d0d56c12aea46d79cee92df7461da");
});
