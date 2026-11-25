import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {Script} from "node:vm";
import test from "node:test";

test("browser runners parse inside the expression wrapper used by playwright-cli",()=>{
  const directory=new URL("../browser/",import.meta.url);
  for(const file of readdirSync(directory).filter(file=>file.endsWith(".mjs"))) {
    const source=readFileSync(new URL(file,directory),"utf8");
    assert.doesNotThrow(()=>new Script(`(${source})`),`${file} must be an expression, not a semicolon-terminated statement`);
  }
});
