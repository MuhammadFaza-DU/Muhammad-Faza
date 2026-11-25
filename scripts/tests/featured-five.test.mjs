import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const json=path=>JSON.parse(readFileSync(new URL(`../../${path}`,import.meta.url),"utf8"));
test("Home exposes five real featured projects in owner order with both localized destinations",()=>{
  const order=["tazk","gamein","stackcrate","capify","mariokan"];
  const media=json("docs/v2/assets/featured-media.json");
  for(const locale of ["id","en"]){
    const html=readFileSync(new URL(`../../dist/${locale}/index.html`,import.meta.url),"utf8");
    assert.deepEqual([...html.matchAll(/id="featured-([^"]+)"/g)].map(m=>m[1]),order);
    for(const id of order)assert.ok(html.includes(`href="/${locale}/project/${id}/"`));
  }
  for(const id of order){
    const item=media.find(record=>record.id===id);
    assert.ok(item,`${id} has no genuine media`);
    assert.equal(item.outputs.length,2);
    assert.notEqual(item.outputs[0].path,item.outputs[1].path);
    assert.ok(item.outputs[0].width>item.outputs[0].height);
    assert.ok(item.outputs[1].height>item.outputs[1].width);
  }
  for(const locale of ["id","en"])for(const id of ["capify","mariokan"]){
    const html=readFileSync(new URL(`../../dist/${locale}/project/${id}/index.html`,import.meta.url),"utf8");
    assert.ok(html.includes(`src="/media/catalog/${id}-960.webp"`),"Home additions must not replace established Detail imagery");
  }
});
