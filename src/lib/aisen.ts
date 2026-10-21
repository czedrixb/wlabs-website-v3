import "server-only";
import { unstable_cache } from "next/cache";
import type { Locale } from "@/lib/locale";

// WOS-346: read-only client for the AISEN Blog API (the source of the
// Insight posts; see docs/aisen-insights-plan.md and the AISEN handover's
// Blog-integration reference). The API is GET-only JSON behind
// `Authorization: Bearer <key_id>.<secret>`, has no CORS by design, and
// caches responses for ~60s on its side — so every call here runs in server
// code and sits behind unstable_cache with the same 60s window the Payload
// reads in cachedPosts.ts use. The key must never reach a client bundle,
// hence the server-only import.
//
// Config is all-or-none à la resolveMailConfig (src/lib/site/mailer.ts):
// any of the three env vars missing means "AISEN not configured" — the
// normal state in local dev/CI by default — and both entry points return
// empty without fetching or caching, so an unconfigured build never bakes
// an empty result into the cache. On a fetch failure with a warm cache,
// unstable_cache serves the stored entry and retries in the background
// (WOS-329 semantics); on a cold cache the error reaches the caller, who
// decides between "render without AISEN posts" (lists) and "error boundary"
// (detail page).

export type AisenTerm = { slug: string; name: string };
export type AisenTranslation = { locale: string; slug: string };
export type AisenImage = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type AisenPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: AisenImage | null;
  categories: AisenTerm[];
  tags: AisenTerm[];
  published_at: string; // ISO 8601, UTC
  updated_at: string;
  locale: string; // the language of THIS version
  translations: AisenTranslation[]; // other published language versions
};

export type AisenPost = AisenPostCard & {
  content_html: string; // sanitised by AISEN on save — render as is
  content_json: Record<string, unknown>;
  schema_version: number;
  images: AisenImage[];
  seo: { title: string | null; description: string | null; keywords: string[] };
};

type AisenPage<T> = {
  data: T[];
  meta: { page: number; per_page: number; total: number; total_pages: number; locale: string };
};

export function aisenConfig(): { base: string; auth: string } | null {
  const base = process.env.AISEN_API_URL?.trim();
  const keyId = process.env.AISEN_KEY_ID?.trim();
  const secret = process.env.AISEN_SECRET?.trim();
  if (!base || !keyId || !secret) {
    // All three unset is the normal path in every environment today — not
    // logged as an error (same register as resolveMailConfig).
    return null;
  }
  return { base: base.replace(/\/+$/, ""), auth: `Bearer ${keyId}.${secret}` };
}

// `cache: "no-store"` keeps Next's fetch cache out of the picture — the
// unstable_cache wrappers below are the single source of truth for the 60s
// window, and double-caching would make revalidateTag("aisen") lie.
async function aisenGet<T>(path: string): Promise<T | null> {
  const config = aisenConfig();
  if (!config) return null;
  const res = await fetch(`${config.base}${path}`, {
    headers: { Authorization: config.auth, Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`AISEN API ${res.status} on ${path}`);
  return (await res.json()) as T;
}

// The API accepts ONLY page/per_page/category/tag/q/locale on /posts and
// answers 400 for anything else (deliberate typo-catching), so the query
// strings below never grow extra params. `locale` is always sent: omitting
// it means "project default" (Korean), never "all languages".
const PER_PAGE = 50;

const fetchAisenPosts = unstable_cache(
  async (locale: Locale): Promise<AisenPostCard[]> => {
    const cards: AisenPostCard[] = [];
    let page = 1;
    for (;;) {
      const res = await aisenGet<AisenPage<AisenPostCard>>(
        `/posts?page=${page}&per_page=${PER_PAGE}&locale=${locale}`,
      );
      if (!res) return cards;
      cards.push(...res.data);
      if (page >= res.meta.total_pages) return cards;
      page += 1;
    }
  },
  ["aisen-posts"],
  { tags: ["aisen"], revalidate: 60 },
);

const fetchAisenPost = unstable_cache(
  async (slug: string, locale: Locale): Promise<AisenPost | null> => {
    const res = await aisenGet<{ data: AisenPost }>(
      `/posts/${encodeURIComponent(slug)}?locale=${locale}`,
    );
    return res?.data ?? null;
  },
  ["aisen-post"],
  { tags: ["aisen"], revalidate: 60 },
);

/** Every published AISEN post in `locale`, newest first. Empty when AISEN
 * is not configured; throws on a cold-cache API failure. */
export async function listAisenPosts(locale: Locale): Promise<AisenPostCard[]> {
  if (!aisenConfig()) return [];
  return fetchAisenPosts(locale);
}

/** One published AISEN post, or null when it has no version in `locale`
 * (the API 404s). Null when AISEN is not configured; throws on a
 * cold-cache API failure. */
export async function getAisenPost(slug: string, locale: Locale): Promise<AisenPost | null> {
  if (!aisenConfig()) return null;
  return fetchAisenPost(slug, locale);
}
