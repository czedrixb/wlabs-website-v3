"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InsightCard, type InsightCardData } from "@/components/site/insights/InsightCard";

// WOS-342: the 404-article body — v3's renderInsightMissing
// (wlabs-01-wired.html:1877-1894). An unknown slug is not quietly swapped
// for the newest article: say so, echo the address the reader asked for,
// and give them the ways out plus the three latest articles.
//
// not-found.tsx receives no params, so the locale and the requested slug
// are derived from the pathname here on the client — which is why the
// server passes BOTH locales' resolved strings/cards down instead of
// resolving one (the payload is a handful of strings and three cards).
export type InsightNotFoundPayload = {
  crumbCompany: string;
  crumbInsights: string;
  nf404Title: string;
  nf404Dek: string;
  nfRequested: string;
  nfAllInsights: string;
  nfBackHome: string;
  latestInsights: string;
  cards: InsightCardData[];
};

type Props = { ko: InsightNotFoundPayload; en: InsightNotFoundPayload };

export function InsightNotFound({ ko, en }: Props) {
  const pathname = usePathname() ?? "";
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko";
  const p = locale === "en" ? en : ko;
  // The last path segment is the slug the reader asked for; on a non-detail
  // path (an unmatched deeper URL) the echo line is simply dropped.
  const m = /^\/(?:ko|en)\/insights\/([^/]+)\/?$/.exec(pathname);
  const requested = m ? decodeURIComponent(m[1]) : null;

  return (
    <>
      <div className="ins-hero on-navy is-404">
        <div className="wrap">
          <nav className="crumbs" aria-label="breadcrumb">
            <Link href={`/${locale}/company/story`}>{p.crumbCompany}</Link>
            <span>/</span>
            <Link href={`/${locale}/company/insights`}>{p.crumbInsights}</Link>
          </nav>
          <p className="ins-404-code" aria-hidden="true">
            404
          </p>
          <h1>{p.nf404Title}</h1>
          <p className="ins-dek">{p.nf404Dek}</p>
          {requested && (
            <p className="ins-meta">
              {p.nfRequested}: <code>{requested}</code>
            </p>
          )}
        </div>
      </div>
      <div className="wrap">
        <div className="ins-404-acts">
          <Link className="btn btn-primary" href={`/${locale}/company/insights`}>
            <span>{p.nfAllInsights}</span>
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
          <Link className="btn btn-ghost" href={`/${locale}`}>
            <span>{p.nfBackHome}</span>
          </Link>
        </div>
        {p.cards.length > 0 && (
          <section className="ins-more">
            <h2>{p.latestInsights}</h2>
            <div className="ins-grid">
              {p.cards.map((c) => (
                <InsightCard key={c.href} card={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
