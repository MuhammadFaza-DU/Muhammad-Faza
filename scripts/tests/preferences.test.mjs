import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("manual theme wins and missing/corrupt preferences start light regardless of system", async () => {
  const { resolveTheme } = await loadModule("lib/preferences.ts");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme(null, true), "light");
  assert.equal(resolveTheme("system", true), "light");
  assert.equal(resolveTheme({ corrupt: true }, false), "light");
});
