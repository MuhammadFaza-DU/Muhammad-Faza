import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("stack requires space for tallest card, every offset, header and clearances", async () => {
  const { canStack } = await loadModule("lib/stack-fit.ts");
  const input = {cardHeights:[520,490,500],headerHeight:120,viewportHeight:700,stackOffset:12,pinGap:24,bottomClearance:24};
  assert.equal(canStack(input),false);
  assert.equal(canStack({...input,viewportHeight:712}),true);
  assert.equal(canStack({...input,viewportHeight:711}),false);
  assert.equal(canStack({...input,cardHeights:[]}),false);
  assert.equal(canStack({...input,cardHeights:[NaN]}),false);
});
