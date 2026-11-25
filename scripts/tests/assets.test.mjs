import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

const root = fileURLToPath(new URL("../../", import.meta.url));
const served = path.join(root, "public");

function manifest() {
  const file = path.join(root, "docs/v2/assets/manifest.json");
  assert.ok(existsSync(file), "Reviewed web asset pipeline is not implemented");
  return JSON.parse(readFileSync(file, "utf8"));
}

test("served asset manifest has real source provenance and only contained output paths", () => {
  const entries = manifest();
  for (const required of ["mf-black", "mf-white", "favicon", "studio", "normal", "armor", "resume", "archivo", "tazk", "gamein", "stackcrate"]) {
    assert.ok(entries.some(entry => entry.id === required), `Missing ${required}`);
  }
  for (const entry of entries) {
    assert.ok(entry.sourcePath || entry.sourceUrl, entry.id);
    assert.match(entry.sourceSha256, /^[a-f0-9]{64}$/, entry.id);
    assert.ok(entry.kind && entry.review && entry.license, entry.id);
    assert.ok(entry.outputs.length > 0, entry.id);
    for (const output of entry.outputs) {
      if (entry.kind !== "font" && entry.kind !== "document") {
        assert.ok(output.width > 0 && output.height > 0, entry.id);
      }
      assert.equal(path.relative(served, path.resolve(served, output.path)).startsWith(".."), false);
      assert.ok(existsSync(path.join(served, output.path)), output.path);
    }
  }
});

test("normal and armor derivatives share a transparent, reserved stage", async () => {
  const entries = manifest();
  const normal = entries.find(e => e.id === "normal").outputs.at(-1);
  const armor = entries.find(e => e.id === "armor").outputs.at(-1);
  assert.deepEqual([normal.width, normal.height], [armor.width, armor.height]);
  for (const output of [normal, armor]) {
    const metadata = await sharp(path.join(served, output.path)).metadata();
    assert.equal(metadata.hasAlpha, true);
    assert.deepEqual([metadata.width, metadata.height], [output.width, output.height]);
  }
});

test("MF derivatives retain selected paths and do not embed a bitmap", () => {
  const entries = manifest();
  const source = readFileSync(path.join(root, "assets/masters/brand/mf-refined.svg"), "utf8");
  const paths = [...source.matchAll(/<path d="([^"]+)"/g)].map(m => m[1]);
  for (const id of ["mf-black", "mf-white", "favicon"]) {
    const entry = entries.find(e => e.id === id);
    const svg = readFileSync(path.join(served, entry.outputs[0].path), "utf8");
    assert.deepEqual([...svg.matchAll(/<path d="([^"]+)"/g)].map(m => m[1]), paths);
    assert.doesNotMatch(svg, /<image|data:|<script|foreignObject/i);
  }
});

test("vector project artwork is rasterized at preview resolution, not favicon resolution", async () => {
  const entry = manifest().find(e => e.id === "stackcrate");
  const output = entry.outputs[0];
  const metadata = await sharp(path.join(served, output.path)).metadata();
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 640);
});

test("resume is copied byte-for-byte and masters are not included in served output", () => {
  manifest();
  const original = readFileSync(path.join(root, "assets/masters/documents/Resume.pdf"));
  const shipped = readFileSync(path.join(served, "assets/documents/Resume.pdf"));
  assert.equal(createHash("sha256").update(shipped).digest("hex"), createHash("sha256").update(original).digest("hex"));
  const names = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else names.push(entry.name);
    }
  }
  walk(served);
  assert.equal(names.includes("DSC07729.JPG"), false);
  assert.equal(names.some(name => name.includes("Monogram") || name.includes("Charcoal Suit")), false);
});

test("Lanyard textures retain studio and selected MF provenance with actual dimensions",async()=>{
  const entries=manifest();
  for(const id of ["lanyard-front","lanyard-brand"]) {
    const entry=entries.find(item=>item.id===id);
    assert.ok(entry,`Missing ${id}`);
    const bytes=readFileSync(path.join(root,entry.sourcePath));
    assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sourceSha256);
    for(const output of entry.outputs) {
      const meta=await sharp(path.join(served,output.path)).metadata();
      assert.deepEqual([meta.width,meta.height],[output.width,output.height]);
    }
  }
});
