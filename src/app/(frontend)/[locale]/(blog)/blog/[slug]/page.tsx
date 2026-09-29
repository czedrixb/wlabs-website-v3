import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPostBySlug } from "@/lib/cachedPosts";
import { resolveLocale } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { siteMetadata } from "@/lib/site/metadata";
import { SiteHeader } from "@/components/frontend/SiteHeader";
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

  return (
    <>
      <SiteHeader locale={locale} path={`/blog/${slug}`} />
      <main className="mx-auto max-w-3xl px-6 pb-16">
        {banner?.url && (
          <Image
            src={mediaPath(banner.url)}
            alt={banner.alt ?? ""}
            width={1600}
            height={900}
            className="mb-8 aspect-video w-full rounded-lg object-cover"
            priority
          />
        )}
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="mt-2 text-sm text-gray-400">
          {author?.name ?? strings.unknownAuthor}
          {post.publishedAt &&
            ` · ${new Date(post.publishedAt).toLocaleDateString(locale)}`}
        </p>
        <article className="prose mt-8 max-w-none">
          {post.content && <RichText data={post.content} />}
        </article>
      </main>
    </>
  );
}
