const publicNames = new Set(["PUBLIC_PROJECT_COMMENTS_API_URL", "PUBLIC_TURNSTILE_SITE_KEY"]);
const syntaxError = () => new Error("Invalid project environment syntax");

export function parsePrivateValues(text) {
  const result = { privateValues: [], publicNames: [], invalidPublicNames: [] };
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.trim());
    if (!match) throw syntaxError();
    const [, name, raw] = match;
    if (/^["'`]/.test(raw)) {
      const quote = raw[0];
      const end = raw.indexOf(quote, 1);
      if (end < 0 || !/^\s*(?:#.*)?$/.test(raw.slice(end + 1))) throw syntaxError();
    }
    const parsed = parseEnv(line);
    if (Object.keys(parsed).length !== 1 || !Object.hasOwn(parsed, name)) throw syntaxError();
    const value = parsed[name];
    // Expansion and escaped/multiline values need runtime-specific resolution.
    // Fail closed instead of comparing an unexpanded or differently decoded key.
    if (/[$\\\r\n]/.test(value)) throw syntaxError();
    if (publicNames.has(name)) result.publicNames.push(name);
    else {
      if (name.startsWith("PUBLIC_")) result.invalidPublicNames.push(name);
      if (value) result.privateValues.push(value);
    }
  }
  result.privateValues = [...new Set(result.privateValues)];
  return result;
}

function representations(values) {
  return [...new Set(values.flatMap(value => [
    value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value),
    Buffer.from(value).toString("base64"), Buffer.from(value).toString("base64url"),
  ]).filter(Boolean))].sort((a, b) => b.length - a.length);
}

export function redact(text, values) {
  let safe = text;
  for (const value of representations(values)) safe = safe.split(value).join("[REDACTED]");
  return safe;
}

export function scanBytes(bytes, privateValues) {
  const privateMatches = representations(privateValues).filter(value => bytes.includes(Buffer.from(value))).length;
  const text = bytes.toString("utf8");
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bsk-(?:proj-|live-)?[A-Za-z0-9_-]{32,}/,
    /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/,
    /\bAKIA[A-Z0-9]{16}\b/,
  ];
  return { privateMatches, patternMatches: patterns.filter(pattern => pattern.test(text)).length };
}
import { parseEnv } from "node:util";
