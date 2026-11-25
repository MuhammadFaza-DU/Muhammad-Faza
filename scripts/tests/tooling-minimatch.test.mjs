import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const parentRequire = createRequire(require.resolve("@typescript-eslint/typescript-estree"));
const { minimatch } = parentRequire("minimatch");
test("TypeScript-ESLint resolves the approved patched matcher without a broad override", () => {
  const packagePath = parentRequire.resolve("minimatch/package.json");
  assert.equal(JSON.parse(readFileSync(packagePath, "utf8")).version, "11.0.1");
  const root = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(root.overrides, { "@typescript-eslint/typescript-estree": { minimatch: "11.0.1" } });
});

test("the parent tool's named minimatch API and dot option preserve project-service glob behavior", () => {
  for (const [path, pattern, expected] of [
    ["eslint.config.mjs", "*.mjs", true], [".config.mjs", "*.mjs", true],
    ["src/client/catalog-context.ts", "src/**/*.ts", true],
    ["src/client/catalog-context.ts", "*.ts", false],
    ["scripts/.hidden/check.mjs", "scripts/**/*.mjs", true],
    ["archive/v1/app.tsx", "src/**/*.ts", false],
    ["src/components/Card.tsx", "src/**/*.{ts,tsx}", true],
  ]) assert.equal(minimatch(path, pattern, { dot: true }), expected, `${path} / ${pattern}`);
});
