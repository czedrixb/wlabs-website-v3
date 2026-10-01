"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";

export type SegNavItem = { key: string; href: string; label: string };

type Props = { items: SegNavItem[]; ariaLabel: string; className?: string };

// The `.seg` segmented sub-nav shared by Work (services/products/cases)
// and Company (story/team/insights) — ported from site/index.html's
// `role="tablist"` button row. Here each segment is a real route, not a
// client-side tab switch (the whole point of porting these as pages), so
// this renders `next/link`s with `aria-current="page"` instead of
// `role="tab"`/`aria-selected`/`aria-controls`, which would describe a
// single-page tab panel this isn't. `useTrackPill` still drives the same
// sliding highlight v3's `.seg-track` has.
//
// WOS-336: rendered from the section layout (work/layout.tsx,
// company/layout.tsx), NOT from each panel page — a layout survives
// navigation between sibling panels, so the track (and its .track-pill)
// stays mounted and the liquid slide actually runs. The active segment is
// derived from the pathname for the same reason: the layout doesn't know
// the panel param.
export function SegNav({ items, ariaLabel, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active =
    items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.key ?? items[0]!.key;
  useTrackPill(trackRef, active);

  return (
    <nav className={className ? `seg ${className}` : "seg"} aria-label={ariaLabel}>
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
