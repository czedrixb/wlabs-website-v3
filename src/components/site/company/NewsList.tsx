"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { InsightKind, InsightLink } from "@/lib/site/content";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

// Locale-resolved twin of content.ts's InsightItem — NewsList is a client
// component, so the page resolves `.ko`/`.en` off INSIGHTS (locale-agnostic,
// living alongside content.generated.ts/dictionary.generated.ts) before
// passing plain strings down, the same way this route already builds
// `timelineItems` for StoryTimeline rather than handing it Bilingual pairs.
// `datetime` is optional and blog-post-only — the hardcoded items' `date`
// is a v3 display string with no parseable form (content.ts), so only
// posts (whose `publishedAt` is a real ISO timestamp) pass it, giving their
// <time> a machine-readable `dateTime` the static items never had.
export type NewsItem = {
  id: string;
  date: string;
  datetime?: string;
  kind: InsightKind;
  link?: InsightLink;
  heading: string;
  body: string;
};

const FILTERS: { key: "all" | InsightKind }[] = [
  { key: "all" },
  { key: "news" },
  { key: "product" },
  { key: "case" },
  { key: "blog" },
];

type Props = { locale: Locale; items: NewsItem[]; s: SiteStrings["insights"]; segProducts: string };

export function NewsList({ locale, items: allItems, s, segProducts }: Props) {
  const [active, setActive] = useState<"all" | InsightKind>("all");
  const trackRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  const kindLabel: Record<InsightKind, string> = {
    news: s.insNews,
    product: s.insProduct,
    case: s.insCase,
    blog: s.insBlog,
  };
  const filterLabel: Record<"all" | InsightKind, string> = { all: s.insAll, ...kindLabel };
  // Internal (non-external) links carry a labelKey naming which chrome
  // string to use — "segProducts" for the product-note item, "readPost"
  // for blog post cards — rather than NewsList hardcoding either.
  const internalLinkLabel: Record<"segProducts" | "readPost", string> = {
    segProducts,
    readPost: s.insReadPost,
  };

  const items = allItems.filter((n) => active === "all" || n.kind === active);

  return (
    <>
      <div className="filters" role="group" aria-label={s.insFilter}>
        <div className="filters-track" ref={trackRef}>
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={active === f.key} onClick={() => setActive(f.key)}>
              {filterLabel[f.key]}
            </button>
          ))}
        </div>
      </div>
      <div className="news">
        {items.map((n) => (
          <article id={n.id} className="news-item" key={n.id} data-kind={n.kind}>
            <time dateTime={n.datetime}>{n.date}</time>
            <div>
              <span className="pcat">{kindLabel[n.kind]}</span>
              <h3>{n.heading}</h3>
              <p>{n.body}</p>
              {n.link &&
                (n.link.external ? (
                  <a className="link" href={n.link.href} target="_blank" rel="noopener noreferrer">
                    Science Exchange ↗
                  </a>
                ) : (
                  <a className="link" href={`/${locale}${n.link.href}`}>
                    <span>{internalLinkLabel[n.link.labelKey ?? "segProducts"]}</span> →
                  </a>
                ))}
            </div>
          </article>
        ))}
      </div>
      <p className="note" style={{ marginTop: "var(--s3)" }}>
        {s.insNote}
      </p>
    </>
  );
}
