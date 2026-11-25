import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { loadModule } from "./load-module.mjs";

const root = new URL("../../", import.meta.url);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const safe = (file, prefix) => {
  assert.ok(file.startsWith(prefix) && !file.includes("..") && !path.isAbsolute(file), file);
  return new URL(file, root);
};

test("all curated cards resolve to traceable decoded responsive evidence, not missing filler", async () => {
  const url = new URL("docs/v2/assets/catalog-media.json", root);
  assert.ok(await access(url).then(() => true, () => false), "Catalog media has not been prepared");
  const media = JSON.parse(await readFile(url, "utf8"));
  const { projects } = await loadModule("data/projects.ts");
  assert.equal(media.length, 11);
  assert.equal(new Set(media.map(item => item.id)).size, 11);
  for (const project of projects) {
    const item = media.find(item => item.id === project.thumbnailId);
    assert.ok(item, project.id);
    assert.ok(item.alt.id && item.alt.en, project.id);
    assert.ok(item.sources.length && item.recipe, project.id);
    for (const source of item.sources) {
      const bytes = await readFile(safe(source.path, "assets/masters/"));
      const metadata = await sharp(bytes).metadata();
      assert.equal(source.sha256, hash(bytes), source.path);
      assert.equal(source.width, metadata.width);
      assert.equal(source.height, metadata.height);
      assert.ok(source.reference && source.state);
    }
    assert.deepEqual(item.outputs.map(output => [output.width, output.height]), [[320, 200], [640, 400], [960, 600]]);
    for (const output of item.outputs) {
      const bytes = await readFile(safe(`public/${output.path}`, "public/media/catalog/"));
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.width, output.width);
      assert.equal(metadata.height, output.height);
      assert.equal(metadata.format, "webp");
      assert.equal(output.sha256, hash(bytes));
    }
  }
});
