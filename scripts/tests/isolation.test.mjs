import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("Astro serves only the new source and allowlisted asset tree", async () => {
  const configPath = path.join(root, "astro.config.mjs");
  assert.ok(existsSync(configPath), "Astro config is not implemented yet");
  const { default: config } = await import(pathToFileURL(configPath).href);
  assert.equal(config.srcDir, "./src");
  assert.equal(config.publicDir, "./public");
  assert.equal(config.output, "static");
});

test("TypeScript checks V2 without including the inert Next app or archive", () => {
  const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  assert.equal(parsed.errors.length, 0);
  const files = parsed.fileNames.map((file) => path.relative(root, file).replaceAll("\\", "/"));
  assert.ok(files.some((file) => file.startsWith("src/components/")), "Promoted V2 is outside typecheck coverage");
  assert.equal(files.some((file) => file.startsWith("src/app/")), false);
  assert.equal(files.some((file) => file.startsWith("archive/")), false);
});

test("ESLint checks V2 and leaves inert V1 source out", async () => {
  const eslint = new ESLint({ cwd: root });
  assert.equal(await eslint.isPathIgnored(path.join(root, "src/env.d.ts")), false);
  assert.equal(await eslint.isPathIgnored(path.join(root, "archive/v1/src/app/page.tsx")), true);
});

test("migration preserves existing source, masters, resume and V1 snapshot", {
  skip: !existsSync(path.join(root, "archive/v1")) && "Local archive is not part of the public active-source export",
}, () => {
  const manifest = JSON.parse(readFileSync(path.join(root, "docs/v2/MIGRATION-INPUT.json"), "utf8"));
  const protectedFiles = Object.entries(manifest.files).filter(([file]) =>
    file.startsWith("src/") || file.startsWith("public/") || file.startsWith("archive/v1/"));
  assert.ok(protectedFiles.length > 100);
  const relocation = JSON.parse(readFileSync(path.join(root, "docs/v2/ROOT-RELOCATION.json"), "utf8"));
  const destinations = new Map(relocation.entries.filter(entry => entry.to).map(entry => [entry.from, entry.to]));
  for (const [file, expected] of protectedFiles) {
    const target = destinations.get(file) ?? file;
    const actual = createHash("sha256").update(readFileSync(path.join(root, target))).digest("hex");
    assert.equal(actual, expected, `Protected file changed: ${file}`);
  }
});
