import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const fixture = [
  { id: "older", category: "web", tags: ["Astro"], firstPublished: { date: "2025-01-01", sourceUrl: "https://example.org/a" }, content: { en: { title: "Calm Site", summary: "A catalog" }, id: { title: "Situs", summary: "Katalog" } } },
  { id: "undated-a", category: "tools", tags: ["C++"], firstPublished: null, content: { en: { title: "Notes", summary: "CLI editor" }, id: { title: "Catatan", summary: "Editor terminal" } } },
  { id: "newer", category: "web", tags: ["TypeScript"], firstPublished: { date: "2026-01-01", sourceUrl: "https://example.org/b" }, content: { en: { title: "New site", summary: "A catalog" }, id: { title: "Situs baru", summary: "Katalog" } } },
  { id: "undated-b", category: "app", tags: ["Dart"], firstPublished: null, content: { en: { title: "Tasks", summary: "Offline" }, id: { title: "Tugas", summary: "Luring" } } },
];

test("search combines one category with visible-locale text and technology names", async () => {
  const { filterProjects } = await loadModule("lib/catalog.ts");
  assert.deepEqual(filterProjects(fixture, " CATalog ", "web", "en").map(p => p.id), ["older", "newer"]);
  assert.deepEqual(filterProjects(fixture, "catalog", "tools", "en"), []);
  assert.deepEqual(filterProjects(fixture, "C++", "all", "id").map(p => p.id), ["undated-a"]);
  assert.deepEqual(filterProjects(fixture, "terminal", "all", "en"), []);
  assert.equal(filterProjects(fixture, "", "all", "en").length, 4);
});

test("publication sorting uses sourced dates and preserves undated input order without mutation", async () => {
  const { sortProjects } = await loadModule("lib/catalog.ts");
  const before = fixture.map(p => p.id);
  assert.deepEqual(sortProjects(fixture).map(p => p.id), ["newer", "older", "undated-a", "undated-b"]);
  assert.deepEqual(fixture.map(p => p.id), before);
});
