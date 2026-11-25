import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("catalog output contains all eleven traceable cards with reserved image geometry", async () => {
  const media=JSON.parse(readFileSync(path.join(root,"docs/v2/assets/catalog-media.json"),"utf8"));
  for(const locale of ["id","en"]) {
    const html=readFileSync(path.join(root,`dist/${locale}/project/index.html`),"utf8");
    assert.equal([...html.matchAll(/data-catalog-card[\s>]/g)].length,11);
    for(const item of media) {
      assert.ok(html.includes(`/${item.outputs[1].path}`),item.id);
      assert.ok(html.includes(`id="project-${item.id}"`),item.id);
    }
    assert.equal([...html.matchAll(/width="640" height="400"/g)].length,11);
    assert.ok(!html.includes("data-opening-screen"));
  }
});

test("static output contains real bilingual Home/catalog/detail destinations", async () => {
  const { projects } = await loadModule("data/projects.ts");
  for (const locale of ["id", "en"]) {
    for (const route of ["", "project/", ...projects.map(p => `project/${p.slug}/`)]) {
      const file = path.join(root, "dist", locale, route, "index.html");
      assert.ok(existsSync(file), `Static destination missing: /${locale}/${route}`);
      const html = readFileSync(file, "utf8");
      assert.match(html, new RegExp(`<html[^>]+lang="${locale}"`));
      assert.match(html, /<h1[\s>]/);
      assert.match(html, new RegExp(`href="/${locale}/project/"`));
      assert.doesNotMatch(html, /href="[^"]*(?:journey|archive\/v1)/i);
    }
  }
  assert.equal(existsSync(path.join(root, "dist/en/project/not-a-project")), false);
  assert.equal(existsSync(path.join(root, "dist/fr")), false);
  assert.equal(existsSync(path.join(root, "dist/archive")), false);
  assert.equal(existsSync(path.join(root, "dist/assets/images/DSC07729.JPG")), false);
});
