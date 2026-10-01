#!/usr/bin/env node
// WOS-332: pulls the team/projects/products data tables the ported Work,
// Company, product/project and Home-strip components need out of the v3
// design repo's built `site/index.html`, and writes them to
// src/lib/site/content.generated.ts.
//
// Unlike the dictionary (WOS-331), this content isn't harvested from
// `data-i` markup — it lives in five top-level JS array/object literals
// the v3 source builds its own DOM from at runtime (`TEAM`, `GROUPS`,
// `PROJECTS`, `CATS`, `PRODUCT_PAGES` — see README.md's "Content that
// lives in data, not markup" table). Each is a self-contained literal with
// no free identifiers, so this script slices out its source text with a
// brace-matching scan (respecting quoted strings, so a `}` inside a string
// doesn't end the literal early) and evaluates it directly — a real parse,
// not a regex scrape, and there is exactly one literal per name so no
// KO/EN precedence question like the dictionary's `data-i` sweep has.
//
// One transform on the way out: TEAM's fifth column is a base64
// `data:image/webp` URI (the avatar baked into the prototype for
// standalone-file portability). This repo already has those 19 photos as
// real files at public/site/team/<FirstName>.webp (ported under WOS-314,
// unreferenced until this ticket) — so the base64 is swapped for that
// public path instead of carried over. Every non-empty photo slot must
// match a file and every file must match a member; either direction
// failing is almost certainly a rename on one side and should fail loudly,
// not silently drop a photo or leave a dangling file.
//
// `ART` (the 9 inline-SVG project illustrations) is deliberately NOT
// extracted here — its entries are template literals closing over the
// source's T/T2/T3/INK palette consts, i.e. presentation, not content. It
// is hand-ported as a React component map at
// src/components/site/work/ProjectArt.tsx instead, the same call WOS-314
// made for the hero mark (HeroMark.tsx).
//
// Usage: node scripts/extract-v3-content.mjs
// Override the v3 repo location with V3_SITE_INDEX if it isn't the default
// sibling checkout (D:\Submit\wlabs-website-v3\site\index.html — the git
// repo; the older "W Labs Website v3" folder is a stale Sept-28 wireframe
// snapshot, not the reference).
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const v3IndexPath =
  process.env.V3_SITE_INDEX ??
  path.resolve(repoRoot, "..", "wlabs-website-v3", "site", "index.html");

const outPath = path.resolve(repoRoot, "src", "lib", "site", "content.generated.ts");
const teamPhotoDir = path.resolve(repoRoot, "public", "site", "team");

function readV3Source() {
  try {
    return readFileSync(v3IndexPath, "utf8");
  } catch (err) {
    throw new Error(
      `Can't read the v3 design repo's site/index.html at ${v3IndexPath}. ` +
        `Set V3_SITE_INDEX if it isn't checked out at the default sibling location. (${err.message})`,
    );
  }
}

// Slices out `const NAME=<literal>;` — an array or object literal, found by
// bracket-depth matching that treats quoted/templated strings as opaque
// (so a `}`/`]` inside "Food / AI" or a template literal never ends the
// scan early). Assumes exactly one top-level `const NAME=` in the source,
// which holds for every name this script asks for.
function sliceConstLiteral(source, name) {
  const declIdx = source.indexOf(`const ${name}=`);
  if (declIdx < 0) throw new Error(`Couldn't find \`const ${name}=\` in the v3 source.`);
  let i = source.indexOf("=", declIdx) + 1;
  while (/\s/.test(source[i])) i++;
  const openChar = source[i];
  const closeChar = openChar === "[" ? "]" : openChar === "{" ? "}" : null;
  if (!closeChar) throw new Error(`\`const ${name}=\` isn't followed by an array/object literal.`);

  let depth = 0;
  let inString = null; // one of ' " ` while inside a string/template
  let j = i;
  for (; j < source.length; j++) {
    const c = source[j];
    if (inString) {
      if (c === "\\") j++; // skip the escaped character
      else if (c === inString) inString = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") inString = c;
    else if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) {
        j++;
        break;
      }
    }
  }
  if (depth !== 0) throw new Error(`Unbalanced ${openChar}${closeChar} parsing \`const ${name}\`.`);
  return source.slice(i, j);
}

// These five literals hold no free identifiers (no calls to helpers defined
// elsewhere in the file, no references to other consts) — verified by hand
// against the v3 source at extraction time — so evaluating them in an
// isolated `new Function` scope is safe and is a real JS parse rather than
// a regex scrape.
function evalConst(source, name) {
  const literal = sliceConstLiteral(source, name);
  try {
    return new Function(`"use strict"; return (${literal});`)();
  } catch (err) {
    throw new Error(`Failed to evaluate \`const ${name}\` from the v3 source: ${err.message}`);
  }
}

// TEAM's photo column: swap the baked-in base64 data URI for the public
// path to the file WOS-314 already checked in, and verify the two sides
// (member list, file list) agree exactly.
function resolveTeamPhotos(team) {
  const files = new Set(readdirSync(teamPhotoDir).map((f) => f.replace(/\.webp$/, "")));
  const named = new Set();

  const resolved = team.map(([name, nameKo, roleEn, roleKo, photoDataUri, group]) => {
    const hasPhoto = Boolean(photoDataUri);
    if (hasPhoto) {
      if (!files.has(name)) {
        throw new Error(
          `TEAM member "${name}" has a photo in the v3 source but no ` +
            `public/site/team/${name}.webp file. Add the file or check the name matches.`,
        );
      }
      named.add(name);
    }
    return [name, nameKo, roleEn, roleKo, hasPhoto ? `/site/team/${name}.webp` : "", group];
  });

  const orphanFiles = [...files].filter((f) => !named.has(f));
  if (orphanFiles.length > 0) {
    throw new Error(
      `public/site/team has photos with no matching TEAM member (rename or remove): ${orphanFiles.join(", ")}`,
    );
  }

  return resolved;
}

// WOS-336: the 27 `li.sp-rail-entry` rows of the company reading log
// (site/index.html:2588-2614). Unlike the const literals above, this is
// markup — but rigidly regular, one entry per line, and the structural
// fields (fractional-year `data-sp-t`, entry type, dates) are exactly the
// values where a hand-transcription typo would silently misplace an entry
// on the rail. Text is NOT harvested here: each row records its v3 `data-i`
// key names, and src/lib/site/content.ts joins them onto the `rail`
// dictionary namespace (v3-rail-manifest.mjs) by stripping the `spRail`
// prefix.
function parseRailEntries(source) {
  const entryRe = /<li class="sp-rail-entry"[^>]*>[\s\S]*?<\/li>/g;
  const entries = [];
  for (const [block] of source.matchAll(entryRe)) {
    const attr = (name) => block.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    const keyOf = (cls) =>
      block.match(new RegExp(`class="${cls}[^"]*"[^>]*data-i="([^"]+)"`))?.[1];

    const id = attr("id")?.replace(/^sp-rail-e-/, "");
    const type = attr("data-sp-type");
    const t = Number(attr("data-sp-t"));
    const time = block.match(/<time datetime="([^"]+)"([^>]*)>([^<]*)<\/time>/);
    const titleKey = keyOf("sp-rail-title");
    const paraKey = keyOf("sp-rail-para");
    if (!id || !type || !Number.isFinite(t) || !time || !titleKey || !paraKey) {
      throw new Error(`sp-rail entry didn't parse (markup drifted?): ${block.slice(0, 120)}…`);
    }

    const enote = block.match(/class="sp-rail-enote( is-ruo)?"[^>]*data-i="([^"]+)"/);
    const breakLine = block.includes("sp-rail-break")
      ? {
          named: Number(block.match(/id="sp-rail-b-named">(\d+)</)?.[1]),
          undisclosed: Number(block.match(/<b>\+(\d+)<\/b>/)?.[1]),
        }
      : undefined;
    const link = block.match(/<a class="sp-rail-link" href="([^"]+)"[^>]*>([^<]*)<\/a>/);
    const total = attr("data-sp-total");

    entries.push({
      id,
      type,
      t,
      ...(total ? { total: Number(total) } : {}),
      datetime: time[1],
      dateLabel: time[3].trim(),
      circa: time[2].includes("sp-rail-circa"),
      titleKey,
      ...(keyOf("sp-rail-meta") ? { metaKey: keyOf("sp-rail-meta") } : {}),
      paraKey,
      ...(enote ? { enoteKey: enote[2], enoteRuo: Boolean(enote[1]) } : {}),
      ...(breakLine ? { breakLine } : {}),
      ...(link ? { link: { href: link[1], label: link[2].trim() } } : {}),
    });
  }
  if (entries.length !== 27) {
    throw new Error(`Expected 27 sp-rail entries in the v3 source, parsed ${entries.length}.`);
  }
  return entries;
}

function main() {
  const source = readV3Source();

  const team = resolveTeamPhotos(evalConst(source, "TEAM"));
  const groups = evalConst(source, "GROUPS");
  const projects = evalConst(source, "PROJECTS");
  const cats = evalConst(source, "CATS");
  const productPages = evalConst(source, "PRODUCT_PAGES");
  // WOS-334: the /contact form's topic <select> — a 12-row [id, ko, en]
  // table, same evalConst treatment as the five literals above (no free
  // identifiers, one top-level `const TOPICS=` in the source).
  const topics = evalConst(source, "TOPICS");
  // WOS-336: the chip-glossary tooltip table ({ Term: [en, ko] }, 23 terms —
  // also indexed by search as kind "term"), the search result-group labels
  // ({ kind: [en, ko] }), and the company reading-log's 27 structural rows.
  const chipTips = evalConst(source, "CHIP_TIPS");
  const searchKinds = evalConst(source, "KIND");
  const rail = parseRailEntries(source);

  const banner = `// GENERATED FILE — do not hand-edit.
// Regenerate with: node scripts/extract-v3-content.mjs
// Source: ${v3IndexPath}
//
// Raw TEAM/GROUPS/PROJECTS/CATS/PRODUCT_PAGES/TOPICS literals harvested
// from the v3 design repo, verbatim except for TEAM's photo column (base64
// data URI swapped for the public/site/team/<Name>.webp path). Every value
// here is still v3's own tuple/array shape ([en, ko] pairs, positional
// TEAM/TOPICS rows) — src/lib/site/content.ts composes these into the
// named, typed shapes components actually consume.
`;

  const body = `export const V3_CONTENT = ${JSON.stringify(
    { team, groups, projects, cats, productPages, topics, chipTips, searchKinds, rail },
    null,
    2,
  )} as const;\n`;

  writeFileSync(outPath, banner + "\n" + body, "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(
    `  team=${team.length} groups=${groups.length} projects=${projects.length} ` +
      `cats=${cats.length} products=${Object.keys(productPages).length} topics=${topics.length} ` +
      `chipTips=${Object.keys(chipTips).length} kinds=${Object.keys(searchKinds).length} rail=${rail.length}`,
  );
}

main();
