"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

type Kind = "news" | "product" | "case";

// Publish metadata (date, kind, optional outbound/internal link) for
// Company → Insights' 5 items — hand-authored directly in v3's markup
// alongside the `data-i` text, not part of any generated table, so it's
// transcribed here rather than harvested. `n1h..n5h`/`n1p..n5p` (the
// heading/body text) come from the dictionary via the `insights` prop.
const NEWS: { id: string; date: string; kind: Kind; link?: { href: string; external?: boolean; labelKey?: "segProducts" } }[] = [
  { id: "ins-1", date: "2026 · 03", kind: "news", link: { href: "https://www.scienceexchange.com", external: true } },
  { id: "ins-2", date: "2026 · 01", kind: "news" },
  { id: "ins-3", date: "2026", kind: "news" },
  { id: "ins-4", date: "2026 · 08", kind: "product", link: { href: "/work/products", labelKey: "segProducts" } },
  { id: "ins-5", date: "2023", kind: "case" },
];

const FILTERS: { key: "all" | Kind }[] = [{ key: "all" }, { key: "news" }, { key: "product" }, { key: "case" }];

type Props = { locale: Locale; s: SiteStrings["insights"]; segProducts: string };

export function NewsList({ locale, s, segProducts }: Props) {
  const [active, setActive] = useState<"all" | Kind>("all");
  const trackRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  const heads = [s.n1h, s.n2h, s.n3h, s.n4h, s.n5h];
  const bodies = [s.n1p, s.n2p, s.n3p, s.n4p, s.n5p];
  const kindLabel: Record<Kind, string> = { news: s.insNews, product: s.insProduct, case: s.insCase };
  const filterLabel: Record<"all" | Kind, string> = { all: s.insAll, ...kindLabel };

  const items = NEWS.filter((n) => active === "all" || n.kind === active);

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
        {items.map((n) => {
          const idx = NEWS.indexOf(n);
          return (
            <article id={n.id} className="news-item" key={n.id} data-kind={n.kind}>
              <time>{n.date}</time>
              <div>
                <span className="pcat">{kindLabel[n.kind]}</span>
                <h3>{heads[idx]}</h3>
                <p>{bodies[idx]}</p>
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
          );
        })}
      </div>
      <p className="note" style={{ marginTop: "var(--s3)" }}>
        {s.insNote}
      </p>
    </>
  );
}
