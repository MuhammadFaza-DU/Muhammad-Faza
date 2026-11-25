import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("catalog keeps all eleven selected works with bilingual content and honest links", async () => {
  const { projects } = await loadModule("data/projects.ts");
  assert.deepEqual(projects.map(p => p.id), ["tazk", "gamein", "stackcrate", "capify", "mariokan", "brawl-buddies", "mini-notepad", "czip", "codecraft", "optimizer-ai-web", "portfolio"]);
  assert.equal(new Set(projects.map(p => p.slug)).size, 11);
  for (const project of projects) {
    assert.ok(project.evidence.length > 0);
    assert.equal(project.firstPublished, null, "Undocumented first-publication dates must remain unknown");
    for (const locale of ["id", "en"]) {
      for (const field of ["title", "summary", "status", "purpose"]) assert.ok(project.content[locale][field]?.length > 0, `${project.id}.${locale}.${field}`);
      assert.equal(project.content[locale].contribution, null, "Do not infer exclusive contribution from repository ownership");
    }
  }
  assert.deepEqual(projects.find(p => p.id === "tazk").links.map(l => l.kind), ["landing", "source"]);
  assert.equal(projects.find(p => p.id === "capify").links.some(l => l.kind === "source"), false);
});

test("skills contain seven tools and eighteen technologies with explanations in both languages", async () => {
  const { tools, technologies } = await loadModule("data/skills.ts");
  assert.equal(tools.length, 7);
  assert.equal(technologies.length, 18);
  assert.deepEqual(tools.map(s => s.name), ["Arduino", "VS Code", "MATLAB", "MySQL", "OpenCode", "Supabase", "Figma"]);
  assert.equal(new Set([...tools, ...technologies].map(s => s.id)).size, 25);
  for (const skill of [...tools, ...technologies]) {
    assert.ok(skill.description.id && skill.description.en);
    assert.equal(skill.group, tools.includes(skill) ? "tool" : "technology");
  }
});

test("localized personal introduction keeps identity, first-person voice and motto", async () => {
  const { id } = await loadModule("i18n/id.ts");
  const { en } = await loadModule("i18n/en.ts");
  assert.equal(id.intro.greeting, "Halo, saya");
  assert.equal(id.intro.name, "Muhammad Faza");
  for(const text of [id.intro,en.intro]){
    assert.ok(text.paragraphs.length>=2);
    assert.ok(text.paragraphs.every(p=>p.trim().length>0));
  }
  assert.ok(id.intro.paragraphs.every(p=>p.startsWith("Saya ")));
  assert.equal(id.intro.motto, "1.0001 is better than 1");
  assert.deepEqual(Object.keys(en).sort(), Object.keys(id).sort());
});
