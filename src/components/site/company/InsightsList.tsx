"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { InsightCategory, InsightShot } from "@/lib/site/insightArticles";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

// WOS-342: NewsList.tsx's successor — v3's rebuilt Insights listing
// (applyInsights, wlabs-01-wired.html:1973-2033): the news/notes/research
// filter pills, six cards to a page with a real numbered pager (the
// source's ghost-filler loop is explicitly flagged "THE BUILD SHOULD
// RENDER REAL PAGES ONLY", :2015-2020), and an empty-category state with
// the logo watermark and a reset back to All. Same client-boundary
// convention as before: the page resolves Bilingual pairs server-side and
// passes plain strings down, already sorted newest-first
// (insightsIndex.ts), so this component never re-sorts.
export type InsightListItem = {
  slug: string;
  dateLabel: string;
  datetime: string;
  categories: InsightCategory[];
  title: string;
  excerpt: string;
  shot?: InsightShot;
};

const FILTERS: Array<"all" | InsightCategory> = ["all", "news", "notes", "research"];
const INS_PER_PAGE = 6;

type Props = { locale: Locale; items: InsightListItem[]; s: SiteStrings["insights"] };

export function InsightsList({ locale, items, s }: Props) {
  const [active, setActive] = useState<"all" | InsightCategory>("all");
  const [page, setPage] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  const catLabel: Record<InsightCategory, string> = {
    news: s.insNews,
    notes: s.insNotes,
    research: s.insResearch,
  };
  const filterLabel: Record<"all" | InsightCategory, string> = { all: s.insAll, ...catLabel };

  const match = items.filter((n) => active === "all" || n.categories.includes(active));
  const pages = Math.max(1, Math.ceil(match.length / INS_PER_PAGE));
  // Clamp rather than reset: a filter switch on page 3 of a 2-page category
  // lands on its last page, same as v3's `if(insPage>pages)insPage=pages`.
  const current = Math.min(page, pages);
  const visible = match.slice((current - 1) * INS_PER_PAGE, current * INS_PER_PAGE);

  const selectFilter = (key: "all" | InsightCategory) => {
    setActive(key);
    setPage(1);
  };
  const goto = (p: number) => {
    setPage(p);
    // v3 :2032 — a page change can land mid-grid, so bring the filter bar
    // (and with it the top of the list) back into view.
    filtersRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <>
      <div className="filters" role="group" aria-label={s.insFilter} ref={filtersRef}>
        <div className="filters-track" ref={trackRef}>
          {FILTERS.map((key) => (
            <button key={key} type="button" aria-pressed={active === key} onClick={() => selectFilter(key)}>
              {filterLabel[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="news">
        {visible.map((n) => (
          <article
            id={n.slug}
            key={n.slug}
            className={n.shot ? "insights-item has-shot" : "insights-item"}
            data-kind={n.categories.join(" ")}
          >
            {n.shot && (
              <span
                className={n.shot.isMark ? "ins-shot is-mark" : "ins-shot"}
                aria-hidden="true"
                style={{ "--shot": `url(${n.shot.src})` } as React.CSSProperties}
              />
            )}
            <time dateTime={n.datetime}>{n.dateLabel}</time>
            <div>
              <span className="pcat">
                {n.categories.map((k, i) => (
                  <span key={k}>
                    {i > 0 && " · "}
                    <span>{catLabel[k]}</span>
                  </span>
                ))}
              </span>
              <h3>{n.title}</h3>
              <p>{n.excerpt}</p>
              <Link className="link read" href={withLocale(`/insights/${n.slug}`, locale)}>
                <span>{s.insRead}</span> →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {match.length === 0 && (
        <div className="ins-empty">
          <svg className="wmark" viewBox="0 0 91 55" aria-hidden="true">
            <use href="#logo-icon-black" />
          </svg>
          <h3>{s.insEmptyTitle.replace("{cat}", filterLabel[active])}</h3>
          <p>{s.insEmptyBody}</p>
          <button type="button" className="btn btn-ghost" onClick={() => selectFilter("all")}>
            <span>{s.insEmptyCta}</span>
            <span className="arr" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      )}

      {/* Drawn even at one page — both arrows and the single number sit
          there disabled, so the list reads as paged rather than ended
          (v3 :2008-2011). */}
      {match.length > 0 && (
        <nav className="ins-pager" aria-label={s.insPages}>
          <button
            type="button"
            className="pg arw"
            disabled={current === 1}
            aria-label={s.pagerPrev}
            onClick={() => goto(current - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className="pg num"
              aria-current={p === current ? "page" : undefined}
              onClick={() => goto(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="pg arw"
            disabled={current === pages}
            aria-label={s.pagerNext}
            onClick={() => goto(current + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}

      <p className="note" style={{ marginTop: "var(--s3)" }}>
        {s.insNote}
      </p>
    </>
  );
}
