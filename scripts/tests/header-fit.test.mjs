import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("header fit preserves a useful viewport instead of clipping growing links", async () => {
  const { computeHeaderMode } = await loadModule("lib/header-fit.ts");
  assert.equal(computeHeaderMode({ fullHeight: 120, navHeight: 48, viewportHeight: 800 }), "normal");
  assert.equal(computeHeaderMode({ fullHeight: 240, navHeight: 60, viewportHeight: 400 }), "nav-only");
  assert.equal(computeHeaderMode({ fullHeight: 240, navHeight: 200, viewportHeight: 400 }), "scrolling-nav");
  assert.equal(computeHeaderMode({ fullHeight: 180, navHeight: 48, viewportHeight: 400 }), "normal");
});
