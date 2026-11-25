import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const libraryPath = "scripts/lib/release-secret-scan.mjs";
test("secret scan library exists", () => assert.equal(existsSync(libraryPath), true));
if (existsSync(libraryPath)) {
  const { parsePrivateValues, scanBytes, redact } = await import(pathToFileURL(`${process.cwd()}/${libraryPath}`).href);
  const fake = "synthetic-private-value-for-scanner-394857";
  test("only explicit public identifiers are excluded from private exact matching", () => {
    const parsed = parsePrivateValues(`PUBLIC_PROJECT_COMMENTS_API_URL=https://api.invalid
PUBLIC_TURNSTILE_SITE_KEY=public-site-key
TURNSTILE_SECRET="${fake}"
ABUSE_HASH_SALT='another-private-value-783493'
PUBLIC_UNEXPECTED_SECRET=${fake}
EMPTY=
`);
    assert.equal(parsed.publicNames.length, 2);
    assert.equal(parsed.privateValues.includes(fake), true);
    assert.equal(parsed.invalidPublicNames.includes("PUBLIC_UNEXPECTED_SECRET"), true);
    assert.equal(parsed.privateValues.includes("https://api.invalid"), false);
  });
  test("exact matcher detects raw, JSON escaped, URL and base64 encodings without returning values", () => {
    for (const value of [fake, "private-value-with-\"quotes-987654"]) {
      for (const representation of [value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value), Buffer.from(value).toString("base64")]) {
        const result = scanBytes(Buffer.from(`prefix ${representation} suffix`), [value]);
        assert.equal(result.privateMatches > 0, true);
        assert.equal(JSON.stringify(result).includes(value), false);
      }
    }
  });
  test("public sitekey is not a leaked private credential", () => {
    const values = parsePrivateValues(`PUBLIC_TURNSTILE_SITE_KEY=public-site-key\nTURNSTILE_SECRET=${fake}`).privateValues;
    assert.equal(scanBytes(Buffer.from("public-site-key"), values).privateMatches, 0);
  });
  test("PEM and provider credential patterns are detected even without local corresponding values", () => {
    assert.equal(scanBytes(Buffer.from(["-----BEGIN", "PRIVATE KEY-----"].join(" ")), []).patternMatches > 0, true);
    assert.equal(scanBytes(Buffer.from(`sk-proj-${"x".repeat(40)}`), []).patternMatches > 0, true);
  });
  test("paths and diagnostics redact private byte representations", () => {
    for (const representation of [fake, encodeURIComponent(fake), Buffer.from(fake).toString("base64")]) {
      assert.equal(redact(`path/${representation}/asset.js`, [fake]).includes(representation), false);
    }
  });
  test("short private values are not silently omitted", () => {
    assert.equal(scanBytes(Buffer.from("abc"), ["abc"]).privateMatches, 1);
  });
  test("malformed env input cannot be called a clean comparison", () => {
    assert.throws(() => parsePrivateValues(`TURNSTILE_SECRET="${fake}`), { message: "Invalid project environment syntax" });
  });
  test("inline comments including quotes never become part of the runtime secret", () => {
    for (const line of [`TURNSTILE_SECRET=${fake}#comment`,
      `TURNSTILE_SECRET="${fake}" # "note"`, `TURNSTILE_SECRET='${fake}' # 'note'`]) {
      const value = parseEnv(line).TURNSTILE_SECRET;
      const parsed = parsePrivateValues(line);
      assert.deepEqual(parsed.privateValues, [value]);
      assert.equal(scanBytes(Buffer.from(value), parsed.privateValues).privateMatches > 0, true);
    }
  });
  test("unsupported expansion and multiline syntax fail closed instead of comparing wrong bytes", () => {
    for (const source of ['TURNSTILE_SECRET=${OTHER_SECRET}', 'TURNSTILE_SECRET="line\nvalue"',
      'TURNSTILE_SECRET="value\\nline"']) {
      assert.throws(() => parsePrivateValues(source), { message: "Invalid project environment syntax" });
    }
  });
}
