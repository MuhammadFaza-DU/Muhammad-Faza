import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("release example declares only the two supported PUBLIC configuration names", () => {
  const template = readFileSync(".env.example", "utf8");
  const names = [...template.matchAll(/^([A-Z_]+)=/gm)].map(match => match[1]).sort();
  assert.deepEqual(names, ["PUBLIC_PROJECT_COMMENTS_API_URL", "PUBLIC_TURNSTILE_SITE_KEY"]);
  assert.doesNotMatch(template, /^TURNSTILE_SECRET=|^ABUSE_HASH_SALT=/m);
});

test("only root env example is eligible for tracking, actual env files stay ignored", () => {
  const paths = [".env.example", ".env", ".env.local", ".env.production",
    "services/comments/.dev.vars", "public/.env.example"];
  const ignored = execFileSync("git", ["check-ignore", "--no-index", "--stdin"], {
    input: paths.join("\n"), encoding: "utf8",
  }).trim().split(/\r?\n/);
  assert.equal(ignored.includes(".env.example"), false);
  for (const path of paths.slice(1)) assert.equal(ignored.includes(path), true, path);
});
