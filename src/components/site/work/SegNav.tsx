"use client";

import { useRef } from "react";
import Link from "next/link";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

export type SegNavItem = { key: string; href: string; label: string };

type Props = { items: SegNavItem[]; active: string; ariaLabel: string };

// The `.seg` segmented sub-nav shared by Work (services/products/cases)
// and Company (story/team/insights) — ported from site/index.html's
// `role="tablist"` button row. Here each segment is a real route, not a
// client-side tab switch (the whole point of porting these as pages), so
// this renders `next/link`s with `aria-current="page"` instead of
// `role="tab"`/`aria-selected`/`aria-controls`, which would describe a
// single-page tab panel this isn't. `useTrackPill` still drives the same
// sliding highlight v3's `.seg-track` has, keyed off the active route.
export function SegNav({ items, active, ariaLabel }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  return (
    <nav className="seg" aria-label={ariaLabel}>
      <div className="wrap">
        <div className="seg-track" ref={trackRef}>
          {items.map((item) => (
            <Link key={item.key} href={item.href} aria-current={item.key === active ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
