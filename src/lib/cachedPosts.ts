import { unstable_cache } from "next/cache";
import { getPayload } from "@/lib/getPayload";

// unstable_cache serves the stored entry and refreshes in the background,
// so a Postgres outage degrades to ≤60s-stale pages instead of a site-wide
// 500 (WOS-329). Post content is bilingual via explicit ko/en fields, not
// Payload locales, so `locale` is not part of either cache key.

// WOS-342: the Insights panel paginates client-side over the full merged
// set of static articles + posts (6 per page, v3's applyInsights), so this
// replaced the old getPostsPage(page) 10-per-page fetch. The limit is a
// sanity cap, not a page size — at 200 published posts the panel's payload
// would need a server-paged rethink anyway. The "posts" tag is load-bearing:
// Posts.ts's afterChange/afterDelete hooks revalidate exactly that tag, and
// an untagged read here would sit on stale data for the full 60s after a
// publish.
export const getInsightPosts = unstable_cache(
  async () => {
    const payload = await getPayload();
    const { docs } = await payload.find({
      collection: "posts",
      overrideAccess: false,
      sort: "-publishedAt",
      limit: 200,
      depth: 1,
    });
    return docs;
  },
  ["posts-insights"],
  { tags: ["posts"], revalidate: 60 },
);

export const getPostBySlug = unstable_cache(
  async (slug: string) => {
    const payload = await getPayload();
    const { docs } = await payload.find({
      collection: "posts",
      overrideAccess: false,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 2,
    });
    return docs[0] ?? null;
  },
  ["post-by-slug"],
  { tags: ["posts"], revalidate: 60 },
);

export const RSS_FEED_LIMIT = 20;

// WOS-334: /ko/rss.xml and /en/rss.xml (src/app/(frontend)/[locale]/rss.xml/route.ts).
// Same unstable_cache treatment as the two functions above, for the same
// reason (WOS-329): a Postgres blip degrades the feed to ≤60s-stale
// instead of a 500.
export const getFeedPosts = unstable_cache(
  async () => {
    const payload = await getPayload();
    const { docs } = await payload.find({
      collection: "posts",
      overrideAccess: false,
      sort: "-publishedAt",
      limit: RSS_FEED_LIMIT,
      depth: 1,
    });
    return docs;
  },
  ["posts-feed"],
  { tags: ["posts"], revalidate: 60 },
);
