import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPostBySlug } from "@/lib/cachedPosts";
import { resolveLocale, withLocale } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { siteMetadata } from "@/lib/site/metadata";
import { siteT } from "@/lib/site/dictionary";
import { t } from "@/lib/strings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// post.title/excerpt render unconditionally in Korean on this page
// (see src/lib/strings.ts's own comment: blog content isn't part of the
// chrome locale switch) — matched here rather than pick()'d, so metadata
// never disagrees with what the page actually renders.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return siteMetadata({ locale, path: `/blog/${slug}`, title: post.title, description: post.excerpt ?? undefined });
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

  return (
    <>
      <div className="wrap">
        <nav className="crumbs" aria-label="breadcrumb">
          <Link href={withLocale("/blog", locale)}>{chrome.tabBlog}</Link>
          <span>/</span>
          <b>{post.title}</b>
        </nav>
      </div>

      <div className="wrap page-head">
        <h1>{post.title}</h1>
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
        <article className="post-body">{post.content && <RichText data={post.content} />}</article>
      </div>
    </>
  );
}
