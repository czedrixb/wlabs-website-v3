// WOS-346: a stand-in for the AISEN Blog API so e2e never depends on the
// live service or its data drifting. Serves the JSON fixtures next to this
// file (captured from the live dev API on 2026-10-21, image URLs re-pointed
// at the app's own /site assets) with the same behaviors the client code
// relies on: Bearer auth (401 without it), strict query-parameter validation
// (400 on unknown names — the live API's deliberate typo-catching),
// pagination meta, locale selection with a Korean default, and RFC 9457
// problem+json error bodies. Started by playwright.config.ts as a second
// webServer; AISEN_API_URL in the app's env points here.
//
// Env: AISEN_STUB_PORT (default 3101), AISEN_KEY_ID + AISEN_SECRET (the
// Bearer pair to require), AISEN_STUB_COVER_ORIGIN (replaces the fixtures'
// __SITE_ORIGIN__ token, normally the app's own baseURL so the "no request
// ever leaves the site origin for AISEN media" assertion stays clean).

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "aisen");
const PORT = Number(process.env.AISEN_STUB_PORT || 3101);
const KEY_ID = process.env.AISEN_KEY_ID || "e2e-key";
const SECRET = process.env.AISEN_SECRET || "e2e-secret";
const ORIGIN = (process.env.AISEN_STUB_COVER_ORIGIN || "http://127.0.0.1:3100").replace(/\/+$/, "");

const load = (name) =>
  JSON.parse(readFileSync(join(DIR, name), "utf8").replaceAll("__SITE_ORIGIN__", ORIGIN));

const PROJECT = load("project.json");
const POSTS = { ko: load("posts.ko.json"), en: load("posts.en.json") };

// /posts items are cards: the full post minus the body/SEO fields.
function toCard(post) {
  const { content_html, content_json, schema_version, images, seo, ...card } = post;
  void content_html, content_json, schema_version, images, seo;
  return card;
}

function send(res, status, body, type = "application/json") {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "private, max-age=60",
  });
  res.end(payload);
}

function problem(res, status, title, detail) {
  send(res, status, { type: "about:blank", title, status, detail }, "application/problem+json");
}

const ALLOWED_LIST_PARAMS = new Set(["page", "per_page", "category", "tag", "q", "locale"]);

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (url.pathname === "/healthz") return send(res, 200, { ok: true });

  if (req.headers.authorization !== `Bearer ${KEY_ID}.${SECRET}`) {
    return problem(res, 401, "Unauthorized", "Send Authorization: Bearer <key_id>.<secret>");
  }

  const locale = url.searchParams.get("locale") || PROJECT.language || "ko";
  if (locale !== "ko" && locale !== "en") {
    return problem(res, 400, "Bad Request", `Invalid locale: ${locale}`);
  }

  if (url.pathname === "/project") return send(res, 200, { data: PROJECT });

  if (url.pathname === "/posts") {
    for (const key of url.searchParams.keys()) {
      if (!ALLOWED_LIST_PARAMS.has(key)) {
        return problem(res, 400, "Bad Request", `Unknown query parameter: ${key}`);
      }
    }
    const page = Number(url.searchParams.get("page") || 1);
    const perPage = Number(url.searchParams.get("per_page") || 10);
    const all = POSTS[locale];
    const totalPages = Math.ceil(all.length / perPage);
    const data = all.slice((page - 1) * perPage, page * perPage).map(toCard);
    return send(res, 200, {
      data,
      meta: { page, per_page: perPage, total: all.length, total_pages: totalPages, locale },
    });
  }

  const postMatch = url.pathname.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    for (const key of url.searchParams.keys()) {
      if (key !== "locale") {
        return problem(res, 400, "Bad Request", `Unknown query parameter: ${key}`);
      }
    }
    const slug = decodeURIComponent(postMatch[1]);
    const post = POSTS[locale].find((p) => p.slug === slug);
    if (!post) return problem(res, 404, "Not Found", `No published post "${slug}" in ${locale}`);
    return send(res, 200, { data: post });
  }

  return problem(res, 404, "Not Found", `Unknown path: ${url.pathname}`);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[aisen-stub] listening on http://127.0.0.1:${PORT} (${POSTS.ko.length} ko / ${POSTS.en.length} en posts)`);
});
