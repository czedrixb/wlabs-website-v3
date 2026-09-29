import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPostsPage } from "@/lib/cachedPosts";
import { resolveLocale, withLocale } from "@/lib/locale";
import { mediaPath } from "@/lib/mediaPath";
import { siteMetadata } from "@/lib/site/metadata";
import { t } from "@/lib/strings";

// Force dynamic rendering — otherwise Next 16's production build can
// statically prerender this list at build time and never see new/updated/
// deleted posts again without a full rebuild. Freshness/resilience of the
// post data itself is handled by unstable_cache in src/lib/cachedPosts.ts.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

// Canonical always points at the unpaginated /blog — no title/description
// override, so (blog)/layout.tsx's own generateMetadata still applies.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  return siteMetadata({ locale: resolveLocale(localeParam), path: "/blog" });
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { docs, totalPages, hasNextPage, hasPrevPage } = await getPostsPage(page);

  const strings = t(locale);

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{strings.blogEyebrow}</span>
        </div>
        <h1>{strings.blogTitle}</h1>
        <p className="lead">{strings.blogLead}</p>
      </div>

      <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
        {docs.length === 0 && <p className="note">{strings.noPosts}</p>}

        <div className="news">
          {docs.map((post) => {
            const banner =
              typeof post.banner === "object" && post.banner ? post.banner : null;
            const author =
              typeof post.author === "object" && post.author ? post.author : null;

            return (
              <article className="news-item" key={post.id}>
                {post.publishedAt && (
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString(locale)}
                  </time>
                )}
                <div>
                  {banner?.url && (
                    <Image
                      src={mediaPath(banner.url)}
                      alt={banner.alt ?? ""}
                      width={800}
                      height={450}
                      className="post-thumb"
                    />
                  )}
                  <h3>
                    <Link href={withLocale(`/blog/${post.slug}`, locale)}>{post.title}</Link>
                  </h3>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <p className="cap">{author?.name ?? strings.unknownAuthor}</p>
                </div>
              </article>
            );
          })}
        </div>

        <nav className="row-between" style={{ marginTop: "var(--s4)" }}>
          {hasPrevPage ? (
            <Link className="link" href={withLocale(`/blog?page=${page - 1}`, locale)}>
              &larr; {strings.previous}
            </Link>
          ) : (
            <span />
          )}
          <span className="small tnum">{strings.pageIndicator(page, totalPages || 1)}</span>
          {hasNextPage ? (
            <Link className="link" href={withLocale(`/blog?page=${page + 1}`, locale)}>
              {strings.next} &rarr;
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </>
  );
}
