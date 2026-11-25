import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("catalog preserves curation and never labels the public V1 as an Astro V2 demo", async () => {
  const { projects } = await loadModule("data/projects.ts");
  assert.deepEqual(projects.map(item => item.id), [
    "tazk", "gamein", "stackcrate", "capify", "mariokan", "brawl-buddies",
    "mini-notepad", "czip", "codecraft", "optimizer-ai-web", "portfolio",
  ]);
  const portfolio = projects.find(item => item.id === "portfolio");
  assert.ok(portfolio.tags.includes("Astro"), "Card must represent current local V2");
  for (const locale of ["id", "en"]) {
    assert.match(portfolio.content[locale].summary, /V2/);
    for (const link of portfolio.links) assert.match(link.label?.[locale] ?? "", /V1/);
  }
  for (const item of projects) {
    if (item.firstPublished) {
      assert.ok(item.firstPublished.sourceUrl);
      assert.ok(Number.isFinite(Date.parse(item.firstPublished.date)));
    }
    assert.ok(item.content.id.summary && item.content.en.summary);
  }
});

test("CZIP acknowledges only the fixture roundtrip actually performed, not unrun or benchmark claims", async () => {
  const { projects } = await loadModule("data/projects.ts");
  const czip=projects.find(item=>item.id==="czip");
  assert.ok(czip.content.en.development.some(text=>text.includes("fixture")&&text.includes("roundtrip")));
  assert.doesNotMatch(czip.content.en.development.join(" "),/has not been rerun/);
  assert.ok(czip.evidence.some(item=>item.kind==="runtime-checked"&&item.checkedAt==="2026-11-15"));
});
