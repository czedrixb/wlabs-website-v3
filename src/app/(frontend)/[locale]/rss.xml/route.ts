import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getFeedPosts, RSS_FEED_LIMIT } from "@/lib/cachedPosts";
import { listAisenPosts } from "@/lib/aisen";
import { pick, withLocale, type Locale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteUrl } from "@/lib/siteUrl";

// WOS-334: a per-locale RSS 2.0 feed at /ko/rss.xml and /en/rss.xml — the
// site is bilingual with no single shared canonical feed, so one per
// locale rather than one combined feed. Posts store Korean in the base
// fields and English in optional *En fields (no Payload locale switcher —
// see src/lib/locale.ts's own comment on why), so `pick()` resolves which
// language a reader actually sees, same as every other locale-aware read
// in this app.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: Request, { params }: Props) {
  const { locale: localeParam } = await params;
  if (localeParam !== "ko" && localeParam !== "en") notFound();
  const locale = localeParam as Locale;

  const { chrome } = siteT(locale);
  const posts = await getFeedPosts();
  // WOS-346: AISEN posts join the feed — unlike the old static articles
  // (month-precision dates, no pubDate to offer) they carry full ISO
  // published_at stamps. Guarded like every AISEN read: a cold-cache outage
  // degrades the feed to CMS posts instead of a 500.
  let aisenPosts: Awaited<ReturnType<typeof listAisenPosts>> = [];
  try {
    aisenPosts = await listAisenPosts(locale);
  } catch {
    // CMS posts only this pass.
  }

  const channelTitle = xmlEscape(`W Labs — ${chrome.legal2}`);
  // Points at the Insights panel, not /blog — the listing that used to live
  // there is gone.
  const channelLink = `${siteUrl}${withLocale("/company/insights", locale)}`;
  const channelDescription = xmlEscape(chrome.legal2);

  type FeedItem = { title: string; excerpt: string; link: string; iso: string };
  const aisenSlugs = new Set(aisenPosts.map((p) => p.slug));
  const feed: FeedItem[] = [
    ...aisenPosts.map((p) => ({
      title: p.title,
      excerpt: p.excerpt ?? "",
      link: `${siteUrl}${withLocale(`/insights/${p.slug}`, locale)}`,
      iso: p.published_at,
    })),
    // Same AISEN-wins slug dedupe as insightsIndex.ts.
    ...posts
      .filter((post) => !aisenSlugs.has(post.slug))
      .map((post) => ({
        title: pick(locale, post.title, post.titleEn),
        excerpt: pick(locale, post.excerpt ?? null, post.excerptEn) ?? "",
        link: `${siteUrl}${withLocale(`/insights/${post.slug}`, locale)}`,
        iso: post.publishedAt ?? post.updatedAt,
      })),
  ]
    .sort((a, b) => b.iso.localeCompare(a.iso))
    .slice(0, RSS_FEED_LIMIT);

  const items = feed
    .map(
      (item) => `  <item>
    <title>${xmlEscape(item.title)}</title>
    <link>${xmlEscape(item.link)}</link>
    <guid isPermaLink="true">${xmlEscape(item.link)}</guid>
    <pubDate>${new Date(item.iso).toUTCString()}</pubDate>
    <description>${xmlEscape(item.excerpt)}</description>
  </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${channelTitle}</title>
    <link>${xmlEscape(channelLink)}</link>
    <description>${channelDescription}</description>
    <language>${locale}</language>
${items}
  </channel>
</rss>
`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
