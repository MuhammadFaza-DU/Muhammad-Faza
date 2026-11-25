import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { handleRequest } from "../../services/comments/src/api.ts";
import { verifyTurnstile } from "../../services/comments/src/turnstile.ts";

const site = "https://mfazaa.my.id";
const pages = "https://mfazaa-portfolio.pages.dev";
const { Request, Response } = globalThis;
const vars = JSON.parse(readFileSync("services/comments/wrangler.jsonc", "utf8")).vars;
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]);

test("built routes identify the new production domain as their canonical origin", () => {
  const html = files("dist").filter(path => path.endsWith(".html"));
  assert.ok(html.length >= 34);
  for (const path of html) {
    const source = readFileSync(path, "utf8");
    const canonical = /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(source)?.[1];
    assert.ok(canonical, `Missing canonical: ${path}`);
    const url = new URL(canonical);
    assert.equal(url.origin, site, path);
    const route = relative("dist", path).replaceAll("\\", "/").replace(/index\.html$/, "");
    // Astro writes 404.html while the source page's pathname remains /404/.
    assert.equal(url.pathname, route === "404.html" ? "/404/" : route === "" ? "/en/" : `/${route}`, path);
  }
});

test("real Worker preflight permits exact production hosts and keeps local review support", async () => {
  for (const origin of [site, pages, "http://127.0.0.1:4321", "http://localhost:4321"]) {
    const response = await handleRequest(new Request(
      "https://comments.example/v1/projects/tazk/comments",
      { method: "OPTIONS", headers: { Origin: origin } },
    ), vars);
    assert.equal(response.status, 204, origin);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
    assert.notEqual(response.headers.get("Access-Control-Allow-Origin"), "*");
  }
});

test("real Worker still rejects unrelated and arbitrary preview origins", async () => {
  for (const origin of ["https://evil.example", "https://random.mfazaa-portfolio.pages.dev", "https://mfazaa.my.id.evil.example"]) {
    const response = await handleRequest(new Request(
      "https://comments.example/v1/projects/tazk/comments",
      { method: "OPTIONS", headers: { Origin: origin } },
    ), vars);
    assert.equal(response.status, 403, origin);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
});

test("Turnstile host binding accepts production hosts but not a forged hostname", async () => {
  const env = { ...vars, TURNSTILE_SECRET: "synthetic-unit-secret" };
  for (const [hostname, expected] of [
    ["mfazaa.my.id", "valid"], ["mfazaa-portfolio.pages.dev", "valid"],
    ["evil.example", "invalid"], ["mfazaa.my.id.evil.example", "invalid"],
  ]) {
    const result = await verifyTurnstile({
      token: "synthetic-token", requestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      slug: "tazk", ip: "192.0.2.1",
    }, env, async () => Response.json({
      success: true, hostname, action: "project_comment", cdata: "tazk",
    }));
    assert.equal(result, expected, hostname);
  }
});

test("static deployment includes non-breaking security headers", () => {
  assert.ok(existsSync("dist/_headers"), "Missing deployable Pages headers");
  const source = readFileSync("dist/_headers", "utf8");
  const headers = new Map([...source.matchAll(/^\s+([^:\n]+):\s*(.+)$/gm)]
    .map(([, name, value]) => [name.toLowerCase(), value.trim()]));
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(headers.get("content-security-policy") ?? "", /object-src 'none'/);
  assert.doesNotMatch(headers.get("content-security-policy") ?? "", /script-src|style-src|connect-src|frame-src/);
  assert.ok(headers.has("strict-transport-security"));
});

test("Pages path redirects never contain unsupported absolute sources or an apex-wide loop", () => {
  assert.ok(existsSync("dist/_redirects"), "Missing Pages redirect controls");
  const entries = readFileSync("dist/_redirects", "utf8").split(/\r?\n/)
    .filter(line => line.trim() && !line.startsWith("#")).map(line => line.trim().split(/\s+/));
  for (const [from] of entries) assert.ok(from.startsWith("/") && !from.startsWith("//"), `Unsupported source ${from}`);
  assert.equal(entries.some(([from]) => from === "/*"), false, "Do not replace native localized routes");
});

test("deployment output excludes private directory trees and environment files", () => {
  for (const path of files("dist")) {
    const name = relative("dist", path).replaceAll("\\", "/");
    assert.doesNotMatch(name, /(^|\/)(?:\.git|\.env[^/]*|\.dev\.vars[^/]*|archive|services|masters)(\/|$)/);
    if (/\.(?:html|js|css|json|txt|svg|map)$/.test(path)) {
      assert.doesNotMatch(readFileSync(path, "utf8"), /assets\/masters\/|docs\/v2\/|\.superpowers\/|(?:D:|C:)\\(?:Users|Progamming)\\/i, name);
    }
  }
});

test("archive preservation guard accepts Pages deployment controls without weakening archive checks", () => {
  const archivePresent = existsSync("archive/v1");
  const output = execFileSync(process.execPath, ["scripts/verify-relocation.mjs", ...(archivePresent ? [] : ["--active-only"])], { encoding: "utf8" });
  assert.match(output, archivePresent ? /Verified 116 immutable relocated files, 92 frozen V1 files/ : /Archive checks not requested/);
});

test("explicit active-only verification checks served-source isolation without claiming archive verification", () => {
  const output = execFileSync(process.execPath, ["scripts/verify-relocation.mjs", "--active-only"], { encoding: "utf8" });
  assert.match(output, /Archive checks not requested/);
  assert.match(output, /root-only V2 and public allowlist/);
  assert.doesNotMatch(output, /116 immutable|92 frozen/);
});
