import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("manual language wins and unsupported browser languages fall through in order", async () => {
  const { resolveEntryLocale } = await loadModule("lib/locale.ts");
  assert.equal(resolveEntryLocale("id", ["en-US"]), "id");
  assert.equal(resolveEntryLocale(null, ["fr", "id-ID"]), "id");
  assert.equal(resolveEntryLocale(null, ["fr", "en-GB", "id"]), "en");
  assert.equal(resolveEntryLocale({ corrupt: true }, ["ja"]), "en");
  assert.equal(resolveEntryLocale("bad", []), "en");
});

test("localized routes keep stable slugs and reject malformed detail paths", async () => {
  const { localizedPath } = await loadModule("lib/locale.ts");
  assert.equal(localizedPath("id", "home"), "/id/");
  assert.equal(localizedPath("en", "project"), "/en/project/");
  assert.equal(localizedPath("id", "detail", "tazk"), "/id/project/tazk/");
  assert.throws(() => localizedPath("id", "detail"), /slug/i);
  assert.throws(() => localizedPath("en", "detail", "../contact"), /slug/i);
});
