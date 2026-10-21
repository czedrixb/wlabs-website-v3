import type { Post } from "@/payload-types";
import { getInsightPosts } from "@/lib/cachedPosts";
import { listAisenPosts, type AisenPostCard } from "@/lib/aisen";
import { mediaPath } from "@/lib/mediaPath";
import { pick, type Locale } from "@/lib/locale";
import type { InsightCategory, InsightShot } from "./insightTaxonomy";

// WOS-342/WOS-346: the one view model behind the Insights listing, the
// article prev/next and the "More insights" rail — all three stay on the
// same sorted sequence (v3 INS_ORDER), except the sequence is now the UNION
// of the AISEN Blog API posts and the CMS posts, scoped to ONE locale.
//
// Locale-scoped, not bilingual: AISEN publishes each language version
// independently (en may not exist for a given post), so only a per-locale
// fetch yields a list whose every slug actually resolves under that locale
// — a bilingual zip would have the /en list linking to real 404s. Payload
// posts keep their explicit ko/*En fields and are resolved with pick() here
// instead of in the pages.

export type InsightEntry = {
  slug: string;
  // Sort key. Both sources carry a full ISO timestamp, so one localeCompare
  // sorts the union (same trick the static articles' YYYY-MM keys used).
  dateKey: string;
  dateLabel: string;
  datetime: string; // <time dateTime> value
  categories: InsightCategory[];
  title: string;
  excerpt: string;
  dek: string;
  shot?: InsightShot;
  source: "aisen" | "post";
};

// Same "YYYY · MM" display form v3's `dl` used — UTC, like the old NewsList
// mapping, so the label can't shift across the server's timezone.
function dateLabelOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()} · ${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function postCategories(post: Post): InsightCategory[] {
  // Legacy posts predate the categories field (WOS-342) — default them to
  // notes at read time, matching the field's own defaultValue, instead of
  // backfilling rows.
  return post.categories?.length ? post.categories : ["notes"];
}

// AISEN's taxonomy is writer-defined slugs; the site's filter pills are the
// fixed v3 trio. `note` (the slug AISEN actually has today) and `notes` both
// land on notes; unknown slugs are dropped rather than crashing the pill
// labels, and a post left with none defaults to notes like postCategories.
const AISEN_CATEGORY_MAP: Record<string, InsightCategory> = {
  note: "notes",
  notes: "notes",
  news: "news",
  research: "research",
};

export function aisenCategories(card: AisenPostCard): InsightCategory[] {
  const mapped = [
    ...new Set(
      card.categories
        .map((t) => AISEN_CATEGORY_MAP[t.slug])
        .filter((c): c is InsightCategory => Boolean(c)),
    ),
  ];
  return mapped.length ? mapped : ["notes"];
}

function aisenToEntry(card: AisenPostCard): InsightEntry {
  const excerpt = card.excerpt ?? "";
  return {
    slug: card.slug,
    dateKey: card.published_at,
    dateLabel: dateLabelOf(card.published_at),
    datetime: card.published_at,
    categories: aisenCategories(card),
    title: card.title,
    excerpt,
    // AISEN posts have no separate dek — the excerpt stands in on the hero
    // and the related cards, same as CMS posts.
    dek: excerpt,
    // cover_image.url is an absolute Supabase URL used verbatim: mediaPath()
    // would strip its origin and break it (it exists to defeat Payload's own
    // serverURL prefix, not external hosts). The shot is a CSS background,
    // so no next/image remotePatterns are involved either.
    ...(card.cover_image ? { shot: { src: card.cover_image.url } } : {}),
    source: "aisen",
  };
}

function postToEntry(post: Post, locale: Locale): InsightEntry {
  const iso = post.publishedAt ?? post.updatedAt;
  const banner = typeof post.banner === "object" && post.banner ? post.banner : null;
  // The 1600x900 derivative when it exists (Media.ts imageSizes), original
  // otherwise — the same fallback the old post page used for .post-thumb.
  const bannerUrl = banner?.sizes?.banner?.url ?? banner?.url;
  const excerpt = pick(locale, post.excerpt ?? "", post.excerptEn);
  return {
    slug: post.slug,
    dateKey: iso,
    dateLabel: dateLabelOf(iso),
    datetime: iso,
    categories: postCategories(post),
    title: pick(locale, post.title, post.titleEn),
    excerpt,
    // Posts have no separate dek field — the excerpt stands in on the hero
    // and the related cards, same as it did on the old page-head.
    dek: excerpt,
    // A post banner is always a photograph treatment, never an is-mark logo
    // plate — marks were a static-article-only distinction (v3 SP_MARK).
    ...(bannerUrl ? { shot: { src: mediaPath(bannerUrl) } } : {}),
    source: "post",
  };
}

// AISEN posts + CMS posts in `locale`, newest first. Each fetch is guarded
// on its own: a Postgres outage degrades the listing to the AISEN entries,
// an AISEN outage to the CMS entries, and both only on a cold cache —
// unstable_cache keeps serving the stored value through a failing refresh
// (WOS-329). Neither takes the Company page down.
export async function getInsightEntries(locale: Locale): Promise<InsightEntry[]> {
  let aisenEntries: InsightEntry[] = [];
  try {
    aisenEntries = (await listAisenPosts(locale)).map(aisenToEntry);
  } catch (err) {
    console.warn(`[insights] AISEN unavailable, listing CMS posts only: ${err}`);
  }

  let postEntries: InsightEntry[] = [];
  try {
    const posts = await getInsightPosts();
    // AISEN wins a slug collision in BOTH the listing and the detail route
    // (the detail page resolves AISEN first), so the colliding CMS post is
    // dropped here too rather than linking a card to the wrong article.
    const aisenSlugs = new Set(aisenEntries.map((e) => e.slug));
    postEntries = posts
      .filter((p) => {
        if (!aisenSlugs.has(p.slug)) return true;
        console.warn(`[insights] payload post "${p.slug}" is shadowed by an AISEN post`);
        return false;
      })
      .map((p) => postToEntry(p, locale));
  } catch {
    // DB unreachable — AISEN entries only.
  }

  return [...aisenEntries, ...postEntries].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
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
