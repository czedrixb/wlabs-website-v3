import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPostBySlug } from "@/lib/cachedPosts";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale, pick } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { postRichTextConverters } from "@/lib/richText";
import { siteMetadata } from "@/lib/site/metadata";
import { siteT, type SiteStrings } from "@/lib/site/dictionary";
import { siteUrl } from "@/lib/siteUrl";
import {
  getInsightArticle,
  INSIGHT_CATEGORY_LABELS,
  type InsightArticle,
  type InsightShot,
} from "@/lib/site/insightArticles";
import {
  getInsightEntries,
  insightNeighbors,
  relatedInsights,
  postCategories,
  type InsightEntry,
} from "@/lib/site/insightsIndex";
import { InsightHero } from "@/components/site/insights/InsightHero";
import { InsightFigures, type ResolvedFigure } from "@/components/site/insights/InsightFigures";
import { ShareRow } from "@/components/site/insights/ShareRow";
import { InsightNav, type InsightNavCell } from "@/components/site/insights/InsightNav";
import { InsightCard, type InsightCardData } from "@/components/site/insights/InsightCard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// WOS-342: the insight single page — v3's renderInsight
// (wlabs-01-wired.html:1895-1955) — serving BOTH content sources behind one
// render model: the six static v3 articles (insightArticles.ts, structured
// body/figures/sources) and the CMS posts (Lexical RichText, banner as the
// hero shot, author byline). Statics resolve first, so a post slug that
// collides with one is unreachable here by design (see insightsIndex.ts).
// Moved from /blog/{slug} (308 in next.config.ts) as part of the rename.

async function resolve(slugParam: string) {
  const slug = decodeURIComponent(slugParam);
  const article = getInsightArticle(slug);
  const post = article ? null : await getPostBySlug(slug);
  if (!article && !post) return null;
  return { slug, article, post };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug: slugParam } = await params;
  const locale = resolveLocale(localeParam);
  const r = await resolve(slugParam);
  if (!r) return {};
  const title = r.article
    ? pick(locale, r.article.title.ko, r.article.title.en)
    : pick(locale, r.post!.title, r.post!.titleEn);
  const description = r.article
    ? pick(locale, r.article.dek.ko, r.article.dek.en)
    : (pick(locale, r.post!.excerpt ?? null, r.post!.excerptEn) ?? undefined);
  return siteMetadata({ locale, path: `/insights/${r.slug}`, title, description });
}

// The standfirst goes on the first PARAGRAPH, not the first block — an
// article that opens with a heading keeps its .stand for the paragraph
// after it (v3 :1910-1914).
function StaticBody({ article, locale }: { article: InsightArticle; locale: Locale }) {
  const standIdx = article.body.findIndex((b) => "p" in b);
  return (
    <>
      {article.body.map((block, i) => {
        if ("h" in block) return <h2 key={i}>{pick(locale, block.h.ko, block.h.en)}</h2>;
        return (
          <p key={i} className={i === standIdx ? "stand" : undefined}>
            {pick(locale, block.p.ko, block.p.en)}
          </p>
        );
      })}
      {article.link && (
        <p>
          {article.link.external ? (
            <a className="link" href={article.link.href} target="_blank" rel="noopener noreferrer">
              {pick(locale, article.link.label.ko, article.link.label.en)}
            </a>
          ) : (
            <Link className="link" href={withLocale(article.link.href, locale)}>
              {pick(locale, article.link.label.ko, article.link.label.en)}
            </Link>
          )}
        </p>
      )}
    </>
  );
}

function Sources({ article, locale, s }: { article: InsightArticle; locale: Locale; s: SiteStrings["insights"] }) {
  if (!article.sources?.length) return null;
  return (
    <section className="ins-src">
      <h3>{s.sources}</h3>
      <ol>
        {article.sources.map((src, i) => {
          const text = pick(locale, src.text.ko, src.text.en);
          // `todo` marks an unverified claim (teal); an external source gets
          // the outbound arrow, an internal one is a plain link.
          const inner = src.todo ? <span className="todo">{text}</span> : text;
          if (!src.href) return <li key={i}>{inner}</li>;
          return (
            <li key={i}>
              {src.href.startsWith("/") ? (
                <Link href={withLocale(src.href, locale)}>{inner}</Link>
              ) : (
                <a href={src.href} target="_blank" rel="noopener noreferrer">
                  {inner} ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default async function InsightDetailPage({ params }: Props) {
  const { locale: localeParam, slug: slugParam } = await params;
  const locale = resolveLocale(localeParam);

  const r = await resolve(slugParam);
  if (!r) notFound();
  const { slug, article, post } = r;

  const s = siteT(locale).insights;
  const catLabel = (k: keyof typeof INSIGHT_CATEGORY_LABELS) =>
    pick(locale, INSIGHT_CATEGORY_LABELS[k].ko, INSIGHT_CATEGORY_LABELS[k].en);

  // One sorted union drives prev/next and the related rail, so the article
  // page and the listing stay on the same sequence (v3 INS_ORDER).
  const entries = await getInsightEntries();
  const categories = article ? article.categories : postCategories(post!);
  const { prev, next } = insightNeighbors(entries, slug);
  const related = relatedInsights(entries, slug, categories);

  const toNavCell = (e?: InsightEntry): InsightNavCell =>
    e && {
      href: withLocale(`/insights/${e.slug}`, locale),
      title: pick(locale, e.title.ko, e.title.en),
    };
  const toCard = (e: InsightEntry): InsightCardData => ({
    href: withLocale(`/insights/${e.slug}`, locale),
    category: catLabel(e.categories[0]),
    dateLabel: pick(locale, e.dateLabel.ko, e.dateLabel.en),
    datetime: e.datetime,
    title: pick(locale, e.title.ko, e.title.en),
    dek: pick(locale, e.dek.ko, e.dek.en),
  });

  let title: string;
  let dek: string | undefined;
  let meta: string | undefined;
  let shot: InsightShot | undefined;
  let figs: ResolvedFigure[] = [];
  let byline = "W Labs";
  let bodyNode: React.ReactNode;

  if (article) {
    title = pick(locale, article.title.ko, article.title.en);
    dek = pick(locale, article.dek.ko, article.dek.en);
    meta = pick(locale, article.dateLabel.ko, article.dateLabel.en);
    shot = article.shot;
    figs = (article.figs ?? []).map((f) => ({
      src: f.src,
      width: f.width,
      height: f.height,
      caption: pick(locale, f.caption.ko, f.caption.en),
    }));
    bodyNode = (
      <>
        <StaticBody article={article} locale={locale} />
        <Sources article={article} locale={locale} s={s} />
      </>
    );
  } else {
    const banner = typeof post!.banner === "object" && post!.banner ? post!.banner : null;
    const bannerUrl = banner?.sizes?.banner?.url ?? banner?.url;
    const author = typeof post!.author === "object" && post!.author ? post!.author : null;
    const iso = post!.publishedAt ?? post!.updatedAt;
    const d = new Date(iso);
    title = pick(locale, post!.title, post!.titleEn);
    dek = pick(locale, post!.excerpt ?? null, post!.excerptEn) ?? undefined;
    meta = `${d.getUTCFullYear()} · ${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    shot = bannerUrl ? { src: mediaPath(bannerUrl) } : undefined;
    byline = author?.name ?? "W Labs";
    const content = pick(locale, post!.content, post!.contentEn);
    bodyNode = (
      // Lexical output keeps the shared .post-body typography; the first-
      // paragraph standfirst is a structured-article affordance only.
      <article className="post-body">
        {content && <RichText data={content} converters={postRichTextConverters} />}
      </article>
    );
  }

  return (
    <>
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
        <article className={figs.length ? "ins-body has-figs" : "ins-body"}>
          <InsightFigures s={s} figs={figs} />
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
