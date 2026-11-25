import assert from "node:assert/strict";
import { existsSync } from "node:fs";

export async function loadModule(relativePath) {
  const url = new URL(`../../src/${relativePath}`, import.meta.url);
  assert.ok(existsSync(url), `V2 module not implemented: ${relativePath}`);
  return import(url.href);
}
