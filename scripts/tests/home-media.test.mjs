import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import test from "node:test";

test("featured images declare actual derivative dimensions, not invented preview proportions", () => {
  const manifest = JSON.parse(readFileSync(new URL("../../docs/v2/assets/manifest.json",import.meta.url),"utf8"));
  const html = readFileSync(new URL("../../dist/en/index.html",import.meta.url),"utf8");
  for (const id of ["tazk","gamein","stackcrate","capify","mariokan"]) {
    const output = manifest.find(asset => asset.id === `featured-${id}`).outputs[0];
    const image = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(tag => tag.includes(`src="/${output.path}"`));
    assert.ok(image,`Missing ${id} image`);
    assert.equal(Number(/width="(\d+)"/.exec(image)?.[1]),output.width,`${id} width`);
    assert.equal(Number(/height="(\d+)"/.exec(image)?.[1]),output.height,`${id} height`);
  }
});

test("featured images use traceable captured screens rather than logo compositions",async()=>{
  const media=JSON.parse(readFileSync(new URL("../../docs/v2/assets/featured-media.json",import.meta.url),"utf8"));
  assert.deepEqual(media.map(item=>item.id),["tazk","gamein","stackcrate","capify","mariokan"]);
  for(const item of media) {
    assert.equal(item.kind,item.id==="mariokan"?"architecture":"screenshot");
    const source=readFileSync(new URL(`../../${item.sourcePath}`,import.meta.url));
    assert.equal(item.sourceSha256,createHash("sha256").update(source).digest("hex"));
    if(item.id==="tazk") {
      assert.ok(item.outputs[0].width/item.outputs[0].height>1.7,"Desktop app preview must fill a wide frame, not float a single phone screen");
      assert.equal(item.sources?.length,3);
      for(const screen of item.sources) {
        const bytes=readFileSync(new URL(`../../${screen.path}`,import.meta.url));
        assert.equal(screen.sha256,createHash("sha256").update(bytes).digest("hex"));
      }
    }
    for(const output of item.outputs) {
      const actual=await sharp(readFileSync(new URL(`../../public/${output.path}`,import.meta.url))).metadata();
      assert.equal(output.width,actual.width);
      assert.equal(output.height,actual.height);
      assert.ok(actual.width>=450);
    }
  }
});

test("Selected work uses populated catalog views with independently framed narrow captures", async()=>{
  const media=JSON.parse(readFileSync(new URL("../../docs/v2/assets/featured-media.json",import.meta.url),"utf8"));
  for(const id of ["gamein","stackcrate"]) {
    const item=media.find(item=>item.id===id);
    assert.equal(item.view,"catalog",`${id} must no longer use the old hero capture`);
    assert.deepEqual(item.outputs.map(output=>[output.width,output.height]),[[1600,900],[600,1100]]);
    assert.notEqual(item.outputs[0].sourcePath,item.outputs[1].sourcePath,"Phone must not be a blind crop of the desktop screenshot");
    for(const output of item.outputs) {
      const source=await sharp(readFileSync(new URL(`../../${output.sourcePath}`,import.meta.url))).metadata();
      assert.equal(source.width,output.width);
      assert.equal(source.height,output.height);
    }
  }
  const gamein=media.find(item=>item.id==="gamein");
  assert.match(gamein.sourceUrl,/\/id\/katalog\/$/);
  const tazk=media.find(item=>item.id==="tazk");
  const frames=tazk.outputs[0].screenFrames;
  assert.equal(frames?.length,3,"All three complete screens must be placed in the desktop preview");
  for(const frame of frames) {
    const source=await sharp(readFileSync(new URL(`../../${frame.path}`,import.meta.url))).metadata();
    assert.ok(Math.abs(frame.width/frame.height-source.width/source.height)<.002,"App screens must not be stretched or cropped");
    assert.ok(frame.left>=0&&frame.top>=0&&frame.left+frame.width<=1600&&frame.top+frame.height<=900,"Each whole screen stays inside its output frame");
  }
});
