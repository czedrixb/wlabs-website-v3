import type { MetadataRoute } from "next";
import { getPayload } from "@/lib/getPayload";
import { withLocale } from "@/lib/locale";
import { siteUrl } from "@/lib/siteUrl";
import { PROJECTS, PRODUCT_ORDER } from "@/lib/site/content";

// Every real (non-redirecting) site route. /work and /company both 302 to
// a default panel (see their own page.tsx) — the panel URLs are listed
// directly instead, so crawlers never index a redirect. /blog is gone too
// (next.config.ts permanently redirects it to /company/insights, which
// posts now render inside) — only its still-real per-post /blog/:slug
// pages are listed below.
const STATIC_PATHS = [
  "/",
  "/work/services",
  "/work/products",
  "/work/cases",
  "/company/story",
  "/company/team",
  "/company/insights",
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
    const path = `/blog/${post.slug}`;
    entries.push({
      ...withAlternates(path),
      lastModified: post.publishedAt ?? post.updatedAt,
    });
  }

  return entries;
}
