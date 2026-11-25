import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, lstatSync } from "node:fs";
import { relative, resolve } from "node:path";
import { parsePrivateValues, scanBytes, redact } from "./lib/release-secret-scan.mjs";

const root = process.cwd();
const sources = [".env", ".env.local", "services/comments/.dev.vars"];
let privateValues = [];
const summary = {
  passed: false, envFilesRead: 0, privateValuesCompared: 0, publicNames: [],
  workingFilesScanned: 0, gitBlobsScanned: 0, gitHistoryBlobsScanned: 0,
  findings: [], errors: [], missingEnvFiles: [], invalidPublicNames: [],
};
// Only sanitized metadata leaves this process. Never echo errors from env/Git.
try {
  for (const path of sources) {
    if (!existsSync(path)) { summary.missingEnvFiles.push(path); continue; }
    const parsed = parsePrivateValues(readFileSync(path, "utf8"));
    privateValues.push(...parsed.privateValues);
    summary.publicNames.push(...parsed.publicNames);
    summary.invalidPublicNames.push(...parsed.invalidPublicNames);
    summary.envFilesRead++;
  }
  privateValues = [...new Set(privateValues)];
  summary.privateValuesCompared = privateValues.length;
  summary.publicNames = [...new Set(summary.publicNames)];
  const inspect = (path, bytes, scope) => {
    const result = scanBytes(bytes, privateValues);
    const privateFile = /(?:^|\/)(?:\.env(?:\.|$)|\.dev\.vars(?:\.|$)|[^/]+\.(?:pem|key)$)/.test(path) &&
      !(path.endsWith(".example") && scope !== "working");
    if (privateFile || result.privateMatches || result.patternMatches) {
      summary.findings.push({ scope, path: redact(path, privateValues), privateFile, ...result });
    }
  };
  const walk = path => {
    if (lstatSync(path).isSymbolicLink()) throw new Error("Symlink in release scan");
    if (!lstatSync(path).isDirectory()) {
      inspect(relative(root, resolve(path)).replaceAll("\\", "/"), readFileSync(path), "working");
      summary.workingFilesScanned++;
      return;
    }
    for (const entry of readdirSync(path)) walk(`${path}/${entry}`);
  };
  for (const path of ["src", "public", "dist"]) {
    if (!existsSync(path)) summary.errors.push(`Missing required scan directory: ${path}`);
    else walk(path);
  }
  const git = args => execFileSync("git", args, { maxBuffer: 128 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] });
  const index = git(["ls-files", "-s", "-z"]).toString().split("\0").filter(Boolean);
  for (const record of index) {
    const match = /^\d+ ([a-f0-9]+) \d\t(.*)$/s.exec(record);
    if (!match) throw new Error("Invalid Git index record");
    const [, oid, path] = match;
    inspect(path, git(["cat-file", "blob", oid]), "index");
    summary.gitBlobsScanned++;
    if (existsSync(path)) {
      if (lstatSync(path).isSymbolicLink()) throw new Error("Tracked symlink requires review");
      inspect(path, readFileSync(path), "tracked-working");
    }
  }
  // Enumerate only reachable repository objects, not unrelated host credentials.
  const objects = git(["rev-list", "--objects", "--all"]).toString().split("\n").filter(Boolean);
  for (const record of objects) {
    const space = record.indexOf(" "), oid = space < 0 ? record : record.slice(0, space);
    if (git(["cat-file", "-t", oid]).toString().trim() !== "blob") continue;
    const path = space < 0 ? `[blob:${oid}]` : record.slice(space + 1);
    inspect(path, git(["cat-file", "blob", oid]), "history");
    summary.gitHistoryBlobsScanned++;
  }
  if (!privateValues.length) summary.errors.push("No private project values available for exact comparison");
  summary.passed = !summary.findings.length && !summary.errors.length && !summary.invalidPublicNames.length;
} catch {
  summary.errors.push("Local audit could not complete; raw error suppressed to protect credentials");
}
console.log(redact(JSON.stringify(summary, null, 2), privateValues));
process.exitCode = summary.passed ? 0 : 1;
