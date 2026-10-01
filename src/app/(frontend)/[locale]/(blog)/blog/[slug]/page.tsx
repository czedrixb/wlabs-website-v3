import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPostBySlug } from "@/lib/cachedPosts";
import { resolveLocale, withLocale, pick } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { siteMetadata } from "@/lib/site/metadata";
import { siteT } from "@/lib/site/dictionary";
import { t } from "@/lib/strings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// The listing this page's breadcrumb used to point back to (/blog) is
// gone — posts now surface inside Company > Insights (NewsList.tsx), which
// is fully bilingual via pick(). post.title/excerpt/content used to render
// unconditionally in Korean regardless of locale; now that an English
// Insights card can link straight into this page, it's switched to
// pick(locale, ko, en) too — same convention rss.xml/route.ts and
// wireContract.ts already use — so the card and the article it opens never
// disagree on language.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const title = pick(locale, post.title, post.titleEn);
  const description = pick(locale, post.excerpt ?? null, post.excerptEn) ?? undefined;
  return siteMetadata({ locale, path: `/blog/${slug}`, title, description });
}

export default async function PostDetailPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const banner = typeof post.banner === "object" && post.banner ? post.banner : null;
  const author = typeof post.author === "object" && post.author ? post.author : null;
  const strings = t(locale);
  const { chrome } = siteT(locale);
  const title = pick(locale, post.title, post.titleEn);
  const content = pick(locale, post.content, post.contentEn);

  return (
    <>
      <div className="wrap">
        <nav className="crumbs" aria-label="breadcrumb">
          <Link href={withLocale("/company/insights", locale)}>{chrome.insights}</Link>
          <span>/</span>
          <b>{title}</b>
        </nav>
      </div>

      <div className="wrap page-head">
        <h1>{title}</h1>
        <p className="cap">
          {author?.name ?? strings.unknownAuthor}
          {post.publishedAt &&
            ` · ${new Date(post.publishedAt).toLocaleDateString(locale)}`}
        </p>
      </div>

      <div className="wrap" style={{ paddingBottom: "var(--sec)" }}>
        {banner?.url && (
          <Image
            src={mediaPath(banner.url)}
            alt={banner.alt ?? ""}
            width={1600}
            height={900}
            className="post-thumb"
            style={{ marginBottom: "var(--s4)" }}
            priority
          />
        )}
        <article className="post-body">{content && <RichText data={content} />}</article>
      </div>
    </>
  );
}
