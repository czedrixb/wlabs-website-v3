import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getFeedPosts } from "@/lib/cachedPosts";
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

  const channelTitle = xmlEscape(`W Labs — ${chrome.legal2}`);
  // Points at the Insights panel, not /blog — the listing that used to live
  // there is gone. The feed stays posts-only: the six static articles
  // (insightArticles.ts) carry month-precision dates with no pubDate to
  // offer a reader, so they aren't folded in (WOS-342).
  const channelLink = `${siteUrl}${withLocale("/company/insights", locale)}`;
  const channelDescription = xmlEscape(chrome.legal2);

  const items = posts
    .map((post) => {
      const title = pick(locale, post.title, post.titleEn);
      const excerpt = pick(locale, post.excerpt ?? null, post.excerptEn) ?? "";
      const link = `${siteUrl}${withLocale(`/insights/${post.slug}`, locale)}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.updatedAt).toUTCString();

      return `  <item>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(link)}</link>
    <guid isPermaLink="true">${xmlEscape(link)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${xmlEscape(excerpt)}</description>
  </item>`;
    })
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
