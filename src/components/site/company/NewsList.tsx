"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { InsightKind } from "@/lib/site/content";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

// Locale-resolved twin of content.ts's InsightItem — NewsList is a client
// component, so the page resolves `.ko`/`.en` off INSIGHTS (locale-agnostic,
// living alongside content.generated.ts/dictionary.generated.ts) before
// passing plain strings down, the same way this route already builds
// `timelineItems` for StoryTimeline rather than handing it Bilingual pairs.
export type NewsItem = {
  id: string;
  date: string;
  kind: InsightKind;
  link?: { href: string; external?: boolean; labelKey?: "segProducts" };
  heading: string;
  body: string;
};

const FILTERS: { key: "all" | InsightKind }[] = [{ key: "all" }, { key: "news" }, { key: "product" }, { key: "case" }];

type Props = { locale: Locale; items: NewsItem[]; s: SiteStrings["insights"]; segProducts: string };

export function NewsList({ locale, items: allItems, s, segProducts }: Props) {
  const [active, setActive] = useState<"all" | InsightKind>("all");
  const trackRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  const kindLabel: Record<InsightKind, string> = { news: s.insNews, product: s.insProduct, case: s.insCase };
  const filterLabel: Record<"all" | InsightKind, string> = { all: s.insAll, ...kindLabel };

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
            <time>{n.date}</time>
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
                    <span>{segProducts}</span> →
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
