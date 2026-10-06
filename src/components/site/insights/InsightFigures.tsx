"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { SiteStrings } from "@/lib/site/dictionary";

// WOS-342: the article's sticky figure rail + expanding lightbox — v3's
// rail markup (wlabs-01-wired.html:1933-1939) and lightbox (:1739-1770).
// A rail figure is a thumbnail of a 1200px-wide capture in a two-fifths
// column, so expanding is the only way to actually read one: every figure
// is a button, Escape/backdrop/the close button dismiss, and focus returns
// to the figure that opened it. The <aside> renders even with no figures —
// that's what reserves the grid column that keeps every article's prose on
// the same measure (see site.css's .ins-body comment).
export type ResolvedFigure = { src: string; width: number; height: number; caption: string };

type Props = { s: SiteStrings["insights"]; figs: ResolvedFigure[] };

export function InsightFigures({ s, figs }: Props) {
  const [open, setOpen] = useState<ResolvedFigure | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(null);
    openerRef.current?.focus();
    openerRef.current = null;
  }

  return (
    <>
      <aside className="ins-figs">
        {figs.map((f) => (
          <figure className="ins-fig" key={f.src}>
            <button
              type="button"
              className="ins-fig-btn"
              aria-label={s.expandImage}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                setOpen(f);
              }}
            >
              <Image src={f.src} width={f.width} height={f.height} alt="" />
            </button>
            <figcaption>{f.caption}</figcaption>
          </figure>
        ))}
      </aside>
      {open && (
        <div
          className="lbox"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button type="button" className="lbox-close" aria-label={s.lightboxClose} onClick={close} ref={closeRef}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <figure>
            <Image src={open.src} width={open.width} height={open.height} alt="" />
            <figcaption>{open.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
