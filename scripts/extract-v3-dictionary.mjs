#!/usr/bin/env node
// WOS-331: pulls the Korean/English pairs the ported site chrome + Home
// components need out of the v3 design repo's built `site/index.html`, and
// writes them to src/lib/site/dictionary.generated.ts.
//
// The v3 page applies its own dictionary at runtime by sweeping
// `data-i="key"` elements (Korean is the authored markup, `EN[key]` is the
// English overlay — see site/index.html's own comment at the `EN` object)
// and `data-i-attr="attr:key"` elements for translated attributes. This
// script does the same walk once, at build time, instead of at runtime:
//
//   1. Parse the `EN` object literal for its key: "value" pairs.
//   2. Walk every `data-i="key"` / `data-i-attr="attr:key"` element and
//      harvest the FIRST occurrence's Korean — matching the source's own
//      `KO[key] = KO[key] ?? ...` precedence, so a key repeated on the page
//      resolves the same way here as it does there.
//   3. Decode the HTML entities the source pre-escapes for its own
//      `innerHTML` injection (`&amp;` etc.) — React renders text nodes, so
//      those must not survive into the dictionary.
//   4. For every key a manifest lists, require BOTH a Korean and an
//      English value to exist. Fail loudly (not a silent Korean fallback)
//      if either side is missing — the one gap in the v3 source itself
//      (`spRailUndisclosed` has no EN) is exactly the bug class this
//      guards against for every future manifest addition.
//
// Three manifests feed this script: v3-dictionary-manifest.mjs (WOS-331 —
// chrome + Home's hero/proof/band/faq), v3-content-manifest.mjs (WOS-332 —
// Work/Company panels, product/project detail pages, Home's project-strip/
// company-teaser, and the rest of the FAQ), and v3-contact-manifest.mjs
// (WOS-334 — the /contact form). They're merged namespace-by-namespace
// before extraction — `home` and `faq` are extended by more than one
// manifest rather than each owning a disjoint set of namespaces, since
// more than one ticket adds fields to Home and to the FAQ.
//
// Usage: node scripts/extract-v3-dictionary.mjs
// Override the v3 repo location with V3_SITE_INDEX if it isn't the default
// sibling checkout (D:\Submit\W Labs Website v3\site\index.html).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MANIFEST as DICTIONARY_MANIFEST } from "./v3-dictionary-manifest.mjs";
import { CONTENT_MANIFEST } from "./v3-content-manifest.mjs";
import { CONTACT_MANIFEST } from "./v3-contact-manifest.mjs";

function mergeManifests(...manifests) {
  const merged = {};
  for (const manifest of manifests) {
    for (const [namespace, fields] of Object.entries(manifest)) {
      merged[namespace] = { ...merged[namespace], ...fields };
    }
  }
  return merged;
}

const MANIFEST = mergeManifests(DICTIONARY_MANIFEST, CONTENT_MANIFEST, CONTACT_MANIFEST);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const v3IndexPath =
  process.env.V3_SITE_INDEX ??
  path.resolve(repoRoot, "..", "W Labs Website v3", "site", "index.html");

const outPath = path.resolve(repoRoot, "src", "lib", "site", "dictionary.generated.ts");

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, "\u00a0");
}

// The EN object's values are JS single/double-quoted string literals, so
// the regex in parseEnglish() captures raw source text that can still hold
// JS escape sequences (\', \u2192, \\, ...) rather than the characters they
// mean. Unescape those the way the JS engine that originally parsed
// site/index.html would, before this ever becomes a plain-text dictionary
// value \u2014 otherwise a literal backslash-u-two-one-nine-two ends up in the
// output instead of "\u2192".
function unescapeJsString(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|n|t|r|.)/g, (_, esc) => {
    if (esc[0] === "u") return String.fromCharCode(parseInt(esc.slice(1), 16));
    if (esc === "n") return "\n";
    if (esc === "t") return "\t";
    if (esc === "r") return "\r";
    return esc; // \' \" \\ etc. \u2014 the backslash was only there to escape it
  });
}

function readV3Source() {
  let raw;
  try {
    raw = readFileSync(v3IndexPath, "utf8");
  } catch (err) {
    throw new Error(
      `Can't read the v3 design repo's site/index.html at ${v3IndexPath}. ` +
        `Set V3_SITE_INDEX if it isn't checked out at the default sibling location. (${err.message})`,
    );
  }
  return raw;
}

// Extracts the `const EN={ ... };` object literal's top-level key: "value"
// pairs. Values in this file are always single- or double-quoted strings
// (no nested objects/arrays) — see the source's own banner comment at
// "i18n: KO in markup, EN from dictionary" — so a flat key:"value" scan is
// enough; no need for a real JS parser.
function parseEnglish(source) {
  const idx = source.indexOf("const EN={");
  if (idx < 0) throw new Error("Couldn't find `const EN={` in the v3 source.");
  const braceOpen = source.indexOf("{", idx);
  let depth = 0;
  let end = -1;
  let inString = null;
  for (let i = braceOpen; i < source.length; i++) {
    const c = source[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === inString) inString = null;
      continue;
    }
    if (c === '"' || c === "'") inString = c;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("Unbalanced braces parsing the v3 `EN` object.");
  const body = source.slice(braceOpen + 1, end);

  const EN = {};
  const re = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(["'])((?:\\.|(?!\2)[\s\S])*)\2/g;
  let m;
  while ((m = re.exec(body))) {
    const [, key, , value] = m;
    if (EN[key] === undefined) EN[key] = decodeEntities(unescapeJsString(value));
  }
  return EN;
}

// Walks every `data-i="key"` element and takes its inner content (as raw
// HTML, since a couple of headings carry `<br>`/`<span>`); walks every
// `data-i-attr="attr:key"` element and takes that attribute's value. First
// occurrence of a key wins, mirroring the source's own KO harvest.
function parseKorean(source) {
  const KO = {};

  const openTagRe = /<([a-zA-Z0-9]+)((?:\s+[^<>]*?)?)\s+data-i="([^"]+)"([^<>]*)>/g;
  let m;
  while ((m = openTagRe.exec(source))) {
    const [, tag, , key] = m;
    if (KO[key] !== undefined) continue;
    const contentStart = openTagRe.lastIndex;
    const closeIdx = source.indexOf(`</${tag}>`, contentStart);
    if (closeIdx < 0) continue;
    KO[key] = decodeEntities(source.slice(contentStart, closeIdx).trim());
  }

  const attrTagRe = /<[a-zA-Z0-9]+\s+[^<>]*?data-i-attr="([a-zA-Z-]+):([^"]+)"[^<>]*>/g;
  while ((m = attrTagRe.exec(source))) {
    const [tagSrc, attr, key] = [m[0], m[1], m[2]];
    if (KO[key] !== undefined) continue;
    const valMatch = tagSrc.match(new RegExp(`${attr}="([^"]*)"`));
    if (valMatch) KO[key] = decodeEntities(valMatch[1]);
  }

  return KO;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// A handful of runtime status strings (contact.sent/sending/failed/invalid/
// needConsent, and the toast widget's — unused here) aren't carried by any
// data-i element at all: the source assigns their Korean directly as
// `KO.key='...';` literals (site/index.html:3217), after the [data-i]/
// [data-i-attr] sweeps parseKorean() replays above. Same `??` precedence:
// first occurrence wins, and this only fills in keys parseKorean() didn't
// already find.
function parseKoreanLiterals(source) {
  const KO = {};
  const re = /KO\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(["'])((?:\\.|(?!\2)[\s\S])*)\2\s*;/g;
  let m;
  while ((m = re.exec(source))) {
    const [, key, , value] = m;
    if (KO[key] === undefined) KO[key] = decodeEntities(unescapeJsString(value));
  }
  return KO;
}

function main() {
  const source = readV3Source();
  const EN = parseEnglish(source);
  const KO = parseKorean(source);
  const KO_LITERALS = parseKoreanLiterals(source);
  for (const [key, value] of Object.entries(KO_LITERALS)) {
    if (KO[key] === undefined) KO[key] = value;
  }

  const missing = [];
  const ko = {};
  const en = {};

  for (const [namespace, fields] of Object.entries(MANIFEST)) {
    ko[namespace] = {};
    en[namespace] = {};
    for (const [field, spec] of Object.entries(fields)) {
      const { v3Key, type } = spec;
      const koRaw = KO[v3Key];
      const enRaw = EN[v3Key];
      if (koRaw === undefined) missing.push(`${namespace}.${field} (v3 key "${v3Key}"): no Korean found via data-i/data-i-attr`);
      if (enRaw === undefined) missing.push(`${namespace}.${field} (v3 key "${v3Key}"): no English found in the EN object`);
      if (koRaw === undefined || enRaw === undefined) continue;

      ko[namespace][field] = type === "html" ? koRaw : stripTags(koRaw);
      en[namespace][field] = type === "html" ? enRaw : stripTags(enRaw);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Manifest keys missing from the v3 source — fix the manifest or the source before regenerating:\n` +
        missing.map((s) => `  - ${s}`).join("\n"),
    );
  }

  const banner = `// GENERATED FILE — do not hand-edit.
// Regenerate with: node scripts/extract-v3-dictionary.mjs
// Source: ${v3IndexPath}
//
// Raw Korean/English pairs harvested from the v3 design repo, scoped to
// scripts/v3-dictionary-manifest.mjs. src/lib/site/dictionary.ts composes
// these into the shape components actually consume (including the
// markup-bearing headings and the proof-band counter template, which stay
// as raw strings here and are parsed there).
`;

  const body = `export const V3_STRINGS = ${JSON.stringify({ ko, en }, null, 2)} as const;\n`;

  writeFileSync(outPath, banner + "\n" + body, "utf8");
  console.log(`Wrote ${outPath}`);
}

main();
