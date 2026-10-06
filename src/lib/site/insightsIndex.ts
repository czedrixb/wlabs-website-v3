import type { Post } from "@/payload-types";
import { getInsightPosts } from "@/lib/cachedPosts";
import { mediaPath } from "@/lib/mediaPath";
import type { Bilingual } from "./content";
import {
  INSIGHT_ARTICLES,
  type InsightArticle,
  type InsightCategory,
  type InsightShot,
} from "./insightArticles";

// WOS-342: the one view model behind the Insights listing, the article
// prev/next and the "More insights" rail — the v3 build keeps all three on
// the same INS_ORDER sequence (wlabs-01-wired.html:1869, :1920-1929), so
// this port does too, except the sequence here is the UNION of the six
// static articles and the CMS posts.

export type InsightEntry = {
  slug: string;
  // Sort key. Statics carry v3's own `d` ("2026-03", "2026-00" = year only);
  // posts carry their publishedAt ISO string. An ISO string extends the same
  // `YYYY-MM` prefix, so one localeCompare interleaves both kinds — and a
  // post dated inside a month sorts above a static stamped only with that
  // month ("2026-03-09T…" > "2026-03"), i.e. finer-grained dates win ties,
  // which is the right reading order.
  dateKey: string;
  dateLabel: Bilingual;
  datetime: string; // <time dateTime> value (ISO for posts, v3's loose form for statics)
  categories: InsightCategory[];
  title: Bilingual;
  excerpt: Bilingual;
  dek: Bilingual;
  shot?: InsightShot;
  isPost?: boolean;
};

function articleToEntry(a: InsightArticle): InsightEntry {
  return {
    slug: a.slug,
    dateKey: a.dateKey,
    dateLabel: a.dateLabel,
    datetime: a.datetime,
    categories: a.categories,
    title: a.title,
    excerpt: a.excerpt,
    dek: a.dek,
    ...(a.shot ? { shot: a.shot } : {}),
  };
}

export function postCategories(post: Post): InsightCategory[] {
  // Legacy posts predate the categories field (WOS-342) — default them to
  // notes at read time, matching the field's own defaultValue, instead of
  // backfilling rows.
  return post.categories?.length ? post.categories : ["notes"];
}

function postToEntry(post: Post): InsightEntry {
  const iso = post.publishedAt ?? post.updatedAt;
  const d = new Date(iso);
  // Same "YYYY · MM" display form the static articles' v3 `dl` uses — UTC,
  // like the old NewsList mapping, so the label can't shift across the
  // server's timezone.
  const dl = `${d.getUTCFullYear()} · ${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const banner = typeof post.banner === "object" && post.banner ? post.banner : null;
  // The 1600x900 derivative when it exists (Media.ts imageSizes), original
  // otherwise — the same fallback the old post page used for .post-thumb.
  const bannerUrl = banner?.sizes?.banner?.url ?? banner?.url;
  const excerpt: Bilingual = {
    ko: post.excerpt ?? "",
    en: post.excerptEn || post.excerpt || "",
  };
  return {
    slug: post.slug,
    dateKey: iso,
    dateLabel: { ko: dl, en: dl },
    datetime: iso,
    categories: postCategories(post),
    title: { ko: post.title, en: post.titleEn || post.title },
    excerpt,
    // Posts have no separate dek field — the excerpt stands in on the hero
    // and the related cards, same as it did on the old page-head.
    dek: excerpt,
    // A post banner is always a photograph treatment, never an is-mark logo
    // plate — marks are a static-article-only distinction (v3 SP_MARK).
    ...(bannerUrl ? { shot: { src: mediaPath(bannerUrl) } } : {}),
    isPost: true,
  };
}

const STATIC_SLUGS = new Set(INSIGHT_ARTICLES.map((a) => a.slug));

// Statics + posts, newest first. The posts fetch is guarded the same way the
// old panel guarded getPostsPage: a Postgres outage degrades the listing to
// the six static articles instead of taking the Company page down ((site)
// has no (blog)/error.tsx equivalent).
export async function getInsightEntries(): Promise<InsightEntry[]> {
  let postEntries: InsightEntry[] = [];
  try {
    const posts = await getInsightPosts();
    // A post whose slug collides with a static article is unreachable at
    // /insights/{slug} (the detail route resolves statics first), so it's
    // dropped from the listing too rather than linking to the wrong article.
    postEntries = posts.filter((p) => !STATIC_SLUGS.has(p.slug)).map(postToEntry);
  } catch {
    // DB unreachable — statics only.
  }
  return [...INSIGHT_ARTICLES.map(articleToEntry), ...postEntries].sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey),
  );
}

// Prev/next are strictly publication-date neighbours in the sorted union,
// relation ignored (v3 :1924: "publication date only"). prev = newer,
// next = older.
export function insightNeighbors(
  entries: InsightEntry[],
  slug: string,
): { prev?: InsightEntry; next?: InsightEntry } {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i < 0) return {};
  return {
    ...(entries[i - 1] ? { prev: entries[i - 1] } : {}),
    ...(entries[i + 1] ? { next: entries[i + 1] } : {}),
  };
}

// "More insights": shared tags first, then newest (v3 :1920-1922 — scored
// by shared-category count; Array.prototype.sort is stable, so ties keep
// the date order the entries already carry).
export function relatedInsights(
  entries: InsightEntry[],
  slug: string,
  categories: InsightCategory[],
): InsightEntry[] {
  return entries
    .filter((e) => e.slug !== slug)
    .map((e) => ({ e, s: e.categories.filter((k) => categories.includes(k)).length }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((r) => r.e);
}
