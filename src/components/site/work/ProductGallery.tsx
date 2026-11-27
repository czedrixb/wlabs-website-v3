"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// WOS-383: the product pages' four captioned stills (v3's `.pg-grid`). Each
// still is a 1600px capture shown as a 16:10 thumbnail, so — like the
// Insights figure rail (InsightFigures.tsx) — every one is a button that
// opens the shared `.lbox` lightbox: Escape, the backdrop or the close
// button dismiss it, and focus returns to the still that opened it.
type Still = { src: string; caption: string };

type Props = { stills: Still[]; expandLabel: string; closeLabel: string };

export function ProductGallery({ stills, expandLabel, closeLabel }: Props) {
  const [open, setOpen] = useState<Still | null>(null);
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
  }, [open]);

  function close() {
    setOpen(null);
    openerRef.current?.focus();
    openerRef.current = null;
  }

  return (
    <>
      <div className="pg-grid">
        {stills.map((st) => (
          <figure className="pg-item" key={st.src}>
            <button
              type="button"
              className="pg-btn"
              aria-label={expandLabel}
              onClick={(e) => {
                openerRef.current = e.currentTarget;
                setOpen(st);
              }}
            >
              <Image src={st.src} width={800} height={500} sizes="(min-width: 900px) 25vw, 50vw" alt="" />
            </button>
            <figcaption>{st.caption}</figcaption>
          </figure>
        ))}
      </div>
      {open && (
        <div
          className="lbox"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button type="button" className="lbox-close" aria-label={closeLabel} onClick={close} ref={closeRef}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <figure>
            <Image src={open.src} width={1600} height={1000} sizes="100vw" alt="" style={{ height: "auto" }} />
            <figcaption>{open.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
