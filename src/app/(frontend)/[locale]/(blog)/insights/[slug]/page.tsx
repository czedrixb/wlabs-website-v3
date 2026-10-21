import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Post } from "@/payload-types";
import { getPostBySlug } from "@/lib/cachedPosts";
import { getAisenPost, type AisenPost } from "@/lib/aisen";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale, pick } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { postRichTextConverters } from "@/lib/richText";
import { siteMetadata } from "@/lib/site/metadata";
import { siteT } from "@/lib/site/dictionary";
import { siteUrl } from "@/lib/siteUrl";
import { INSIGHT_CATEGORY_LABELS, type InsightShot } from "@/lib/site/insightTaxonomy";
import {
  getInsightEntries,
  insightNeighbors,
  relatedInsights,
  postCategories,
  aisenCategories,
  type InsightEntry,
} from "@/lib/site/insightsIndex";
import { SetLangTargets } from "@/components/site/chrome/LangTargetContext";
import { InsightHero } from "@/components/site/insights/InsightHero";
import { InsightFigures } from "@/components/site/insights/InsightFigures";
import { ShareRow } from "@/components/site/insights/ShareRow";
import { InsightNav, type InsightNavCell } from "@/components/site/insights/InsightNav";
import { InsightCard, type InsightCardData } from "@/components/site/insights/InsightCard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// WOS-342/WOS-346: the insight single page — v3's renderInsight
// (wlabs-01-wired.html:1895-1955) — serving BOTH content sources behind one
// render model: the AISEN Blog API posts (sanitised content_html, cover as
// the hero shot, per-locale versions) and the CMS posts (Lexical RichText,
// banner as the hero shot, author byline). AISEN resolves first, matching
// the listing's dedupe order (insightsIndex.ts), so a CMS slug that collides
// with an AISEN post is unreachable here by design. Moved from /blog/{slug}
// (308 in next.config.ts) as part of the rename.
//
// Stays force-dynamic (WOS-342): on this Next version the page already
// returns a real HTTP 404 through notFound() (asserted in
// e2e/wos342-insights.spec.ts), and next.config.ts's htmlLimitedBots
// handling depends on the route streaming. The 60s cache lives in the data
// layer (unstable_cache in aisen.ts / cachedPosts.ts), not the route.

type Resolved =
  | { slug: string; source: "aisen"; aisen: AisenPost }
  | { slug: string; source: "post"; post: Post };

async function resolve(slugParam: string, locale: Locale): Promise<Resolved | null> {
  const slug = decodeURIComponent(slugParam);
  // AISEN first, guarded: with a warm cache unstable_cache absorbs an API
  // failure by serving the stored entry, so this throw only happens cold.
  let aisenError: unknown = null;
  try {
    const aisen = await getAisenPost(slug, locale);
    if (aisen) return { slug, source: "aisen", aisen };
  } catch (err) {
    aisenError = err;
  }
  const post = await getPostBySlug(slug);
  if (post) return { slug, source: "post", post };
  // A cold-cache AISEN outage must NOT turn a real article into a 404 (that
  // can deindex it) — bubble to (blog)/error.tsx's retry page instead, the
  // same way a Postgres outage does via getPostBySlug. Only when both
  // sources actually answered "no such post" is this a genuine 404.
  if (aisenError) throw aisenError;
  return null;
}

// The site's two locales are the only ones AISEN can publish; anything else
// in `translations` is ignored rather than linked to a route that can't
// exist (layout.tsx 404s any non-ko/en prefix).
function siteTranslation(aisen: AisenPost, locale: Locale): { locale: Locale; slug: string } | null {
  for (const t of aisen.translations) {
    if ((t.locale === "ko" || t.locale === "en") && t.locale !== locale) {
      return { locale: t.locale, slug: t.slug };
    }
  }
  return null;
}

// WOS-343 follow-up: a CMS post's own banner photo is a better og:image than
// the generic branded /og card when one exists. Mirrors the page body's own
// banner resolution below (the `else` branch's `bannerUrl`) but adds the
// two checks that matter for a scraper and not for the hero shot: skip SVG
// (Facebook/LinkedIn don't accept it as og:image) and carry the derivative's
// own width/height rather than hardcoding the generated card's 1200x630.
// Static articles have no banner field at all — this only ever applies to
// CMS posts, so a static article keeps using the generated card.
function postOgImage(post: Post): { url: string; width?: number; height?: number; alt?: string } | undefined {
  const banner = typeof post.banner === "object" && post.banner ? post.banner : null;
  if (!banner?.mimeType?.startsWith("image/") || banner.mimeType === "image/svg+xml") return undefined;
  const sized = banner.sizes?.banner;
  const url = sized?.url ?? banner.url;
  if (!url) return undefined;
  return {
    url: mediaPath(url),
    width: sized?.width ?? banner.width ?? undefined,
    height: sized?.height ?? banner.height ?? undefined,
    alt: banner.alt,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug: slugParam } = await params;
  const locale = resolveLocale(localeParam);
  const r = await resolve(slugParam, locale);
  if (!r) return {};

  if (r.source === "aisen") {
    const { aisen } = r;
    const title = aisen.seo.title ?? aisen.title;
    const description = aisen.seo.description ?? aisen.excerpt ?? undefined;
    const categories = aisenCategories(aisen);
    const kicker = pick(
      locale,
      INSIGHT_CATEGORY_LABELS[categories[0]].ko,
      INSIGHT_CATEGORY_LABELS[categories[0]].en,
    );
    // hreflang: only the versions that actually resolve — self plus whatever
    // `translations` says is published. The default ko+en pair would point
    // crawlers at a 404 for untranslated posts (see siteMetadata's comment).
    const translation = siteTranslation(aisen, locale);
    const languages: Partial<Record<Locale, string>> = {
      [locale]: withLocale(`/insights/${r.slug}`, locale),
    };
    if (translation) {
      languages[translation.locale] = withLocale(`/insights/${translation.slug}`, translation.locale);
    }
    return {
      // seo.keywords is always an array; the tag is emitted only when the
      // writer actually set keywords (Blog-integration §6.2).
      ...(aisen.seo.keywords.length ? { keywords: aisen.seo.keywords } : {}),
      ...siteMetadata({
        locale,
        path: `/insights/${r.slug}`,
        title,
        description,
        type: "article",
        kicker,
        languages,
        ...(aisen.cover_image
          ? {
              ogImage: {
                url: aisen.cover_image.url,
                ...(aisen.cover_image.width ? { width: aisen.cover_image.width } : {}),
                ...(aisen.cover_image.height ? { height: aisen.cover_image.height } : {}),
                alt: aisen.cover_image.alt ?? title,
              },
            }
          : {}),
      }),
    };
  }

  const { post } = r;
  const title = pick(locale, post.title, post.titleEn);
  const description = pick(locale, post.excerpt ?? null, post.excerptEn) ?? undefined;
  // WOS-343: "article" (not the siteMetadata default "website") so the OG
  // card picks up article semantics, and the post's own first category
  // becomes the card's kicker — the same label the hero/listing cards show.
  const categories = postCategories(post);
  const kicker = pick(locale, INSIGHT_CATEGORY_LABELS[categories[0]].ko, INSIGHT_CATEGORY_LABELS[categories[0]].en);
  const ogImage = postOgImage(post);
  return siteMetadata({ locale, path: `/insights/${r.slug}`, title, description, type: "article", kicker, ogImage });
}

export default async function InsightDetailPage({ params }: Props) {
  const { locale: localeParam, slug: slugParam } = await params;
  const locale = resolveLocale(localeParam);

  const r = await resolve(slugParam, locale);
  if (!r) notFound();
  const { slug } = r;

  const s = siteT(locale).insights;
  const catLabel = (k: keyof typeof INSIGHT_CATEGORY_LABELS) =>
    pick(locale, INSIGHT_CATEGORY_LABELS[k].ko, INSIGHT_CATEGORY_LABELS[k].en);

  // One sorted union drives prev/next and the related rail, so the article
  // page and the listing stay on the same sequence (v3 INS_ORDER).
  const entries = await getInsightEntries(locale);
  const categories = r.source === "aisen" ? aisenCategories(r.aisen) : postCategories(r.post);
  const { prev, next } = insightNeighbors(entries, slug);
  const related = relatedInsights(entries, slug, categories);

  const toNavCell = (e?: InsightEntry): InsightNavCell =>
    e && {
      href: withLocale(`/insights/${e.slug}`, locale),
      title: e.title,
    };
  const toCard = (e: InsightEntry): InsightCardData => ({
    href: withLocale(`/insights/${e.slug}`, locale),
    category: catLabel(e.categories[0]),
    dateLabel: e.dateLabel,
    datetime: e.datetime,
    title: e.title,
    dek: e.dek,
  });

  const dateLabelOf = (iso: string) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()} · ${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };

  let title: string;
  let dek: string | undefined;
  let meta: string | undefined;
  let shot: InsightShot | undefined;
  let byline = "W Labs";
  let bodyNode: React.ReactNode;
  let langSwitch: { href: string; locale: Locale; label: string } | null = null;
  let langTargets: React.ReactNode = null;

  if (r.source === "aisen") {
    const { aisen } = r;
    title = aisen.title;
    dek = aisen.excerpt ?? undefined;
    meta = dateLabelOf(aisen.published_at);
    // cover_image.url is absolute (Supabase) and used verbatim — the hero
    // shot is a CSS background, so neither mediaPath() nor remotePatterns
    // apply (see insightsIndex.ts).
    shot = aisen.cover_image ? { src: aisen.cover_image.url } : undefined;
    bodyNode = (
      // content_html is sanitised by AISEN on save — rendered as is, per the
      // integration contract (Blog-integration §9); .post-body supplies the
      // same typography the CMS posts get.
      <article
        className="post-body"
        lang={aisen.locale}
        dangerouslySetInnerHTML={{ __html: aisen.content_html }}
      />
    );
    const translation = siteTranslation(aisen, locale);
    if (translation) {
      langSwitch = {
        href: withLocale(`/insights/${translation.slug}`, translation.locale),
        locale: translation.locale,
        label: translation.locale === "ko" ? s.langToKo : s.langToEn,
      };
    }
    // Point the floating LangToggle at the real other-language URL — or, when
    // no translation exists, at the other locale's insights list instead of
    // the prefix-swapped 404 (see LangTargetContext).
    const other: Locale = locale === "ko" ? "en" : "ko";
    langTargets = <SetLangTargets targets={{ [other]: langSwitch ? langSwitch.href : null }} />;
  } else {
    const { post } = r;
    const banner = typeof post.banner === "object" && post.banner ? post.banner : null;
    const bannerUrl = banner?.sizes?.banner?.url ?? banner?.url;
    const author = typeof post.author === "object" && post.author ? post.author : null;
    const iso = post.publishedAt ?? post.updatedAt;
    title = pick(locale, post.title, post.titleEn);
    dek = pick(locale, post.excerpt ?? null, post.excerptEn) ?? undefined;
    meta = dateLabelOf(iso);
    shot = bannerUrl ? { src: mediaPath(bannerUrl) } : undefined;
    byline = author?.name ?? "W Labs";
    const content = pick(locale, post.content, post.contentEn);
    bodyNode = (
      // Lexical output keeps the shared .post-body typography.
      <article className="post-body">
        {content && <RichText data={content} converters={postRichTextConverters} />}
      </article>
    );
  }

  return (
    <>
      {langTargets}
      <InsightHero
        locale={locale}
        s={s}
        cats={categories.map(catLabel)}
        title={title}
        dek={dek}
        meta={meta}
        shot={shot}
      />
      <div className="wrap">
        <article className="ins-body">
          {/* Zero figures still render the (empty) rail aside — it reserves
              the wide-viewport grid column that keeps every article's prose
              on the same measure (see InsightFigures/site.css). AISEN body
              images arrive inline inside content_html instead. */}
          <InsightFigures s={s} figs={[]} />
          <div className="ins-prose">{bodyNode}</div>
        </article>

        <div className="ins-foot">
          <div className="ins-by">
            <span className="av">
              <svg viewBox="0 0 91 55" aria-hidden="true">
                <use href="#logo-icon-black" />
              </svg>
            </span>
            <span>
              <span className="l">{s.writtenBy}</span>
              <b>{byline}</b>
            </span>
          </div>
          {langSwitch && (
            <Link
              className="link ins-lang"
              href={langSwitch.href}
              hrefLang={langSwitch.locale}
              lang={langSwitch.locale}
            >
              {langSwitch.label}
            </Link>
          )}
          <ShareRow s={s} url={`${siteUrl}${withLocale(`/insights/${slug}`, locale)}`} />
        </div>

        <InsightNav s={s} prev={toNavCell(prev)} next={toNavCell(next)} />

        {related.length > 0 && (
          <section className="ins-more">
            <h2>{s.moreInsights}</h2>
            <div className="ins-grid">
              {related.map((e) => (
                <InsightCard key={e.slug} card={toCard(e)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
