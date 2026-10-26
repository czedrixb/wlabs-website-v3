import type { MetadataRoute } from "next";
import { getPayload } from "@/lib/getPayload";
import { withLocale } from "@/lib/locale";
import { siteUrl } from "@/lib/siteUrl";
import { PROJECTS, PRODUCT_ORDER } from "@/lib/site/content";
import { listAisenPosts, type AisenPostCard } from "@/lib/aisen";
import { insightPath } from "@/lib/site/insightPath";

// Every real (non-redirecting) site route. /work and /company both 302 to
// a default panel (see their own page.tsx) — the panel URLs are listed
// directly instead, so crawlers never index a redirect. /blog is gone
// entirely (next.config.ts 308s the listing to /company/insights and
// WOS-342 moved the detail pages to /insights/:slug) — the real per-post
// and per-article /insights/:slug pages are listed below.
const STATIC_PATHS = [
  "/",
  "/work/services",
  "/work/products",
  "/work/cases",
  "/company/story",
  "/company/team",
  "/company/insights",
  "/legal/privacy",
  "/legal/terms",
  "/contact",
  "/search",
];

function withAlternates(path: string): MetadataRoute.Sitemap[number] {
  const url = `${siteUrl}${withLocale(path, "ko")}`;
  return {
    url,
    alternates: {
      languages: {
        ko: `${siteUrl}${withLocale(path, "ko")}`,
        en: `${siteUrl}${withLocale(path, "en")}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(withAlternates);

  for (const product of PRODUCT_ORDER) {
    entries.push(withAlternates(`/products/${product}`));
  }
  for (const project of PROJECTS) {
    entries.push(withAlternates(`/projects/${project.id}`));
  }
  // WOS-346: AISEN insight posts. Unlike every other route, a language
  // version only exists once a writer publishes it, so hreflang comes from
  // each post's own `translations` instead of withAlternates' unconditional
  // ko+en pair — advertising a missing version would point crawlers at a
  // real 404. Convention matches withAlternates: one row per post, on its
  // Korean URL when a Korean version exists, with the English URL as an
  // alternate; English-only posts get their own row. AISEN unreachable on a
  // cold cache → the posts are simply absent from this pass.
  let aisenKo: AisenPostCard[] = [];
  let aisenEn: AisenPostCard[] = [];
  try {
    [aisenKo, aisenEn] = await Promise.all([listAisenPosts("ko"), listAisenPosts("en")]);
  } catch {
    // Keep the rest of the sitemap intact.
  }
  const enSlugsLinkedFromKo = new Set<string>();
  for (const card of aisenKo) {
    const en = card.translations.find((t) => t.locale === "en");
    if (en) enSlugsLinkedFromKo.add(en.slug);
    entries.push({
      url: `${siteUrl}${withLocale(insightPath(card.slug), "ko")}`,
      lastModified: card.updated_at,
      alternates: {
        languages: {
          ko: `${siteUrl}${withLocale(insightPath(card.slug), "ko")}`,
          ...(en ? { en: `${siteUrl}${withLocale(insightPath(en.slug), "en")}` } : {}),
        },
      },
    });
  }
  for (const card of aisenEn) {
    if (enSlugsLinkedFromKo.has(card.slug)) continue; // already the ko row's alternate
    entries.push({
      url: `${siteUrl}${withLocale(insightPath(card.slug), "en")}`,
      lastModified: card.updated_at,
      alternates: {
        languages: { en: `${siteUrl}${withLocale(insightPath(card.slug), "en")}` },
      },
    });
  }

  // Published posts only — same overrideAccess:false + no user convention
  // as getPostsPage (src/lib/cachedPosts.ts), which resolves to Posts.ts's
  // own `{ _status: { equals: "published" } }` anonymous-read filter.
  const payload = await getPayload();
  const { docs: posts } = await payload.find({
    collection: "posts",
    overrideAccess: false,
    sort: "-publishedAt",
    limit: 0,
    depth: 0,
  });

  for (const post of posts) {
    const path = insightPath(post.slug);
    entries.push({
      ...withAlternates(path),
      lastModified: post.publishedAt ?? post.updatedAt,
    });
  }

  return entries;
}
