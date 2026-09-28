"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { isDarkAt, parkAboveFooter } from "./lib/surfaceSampler";

type Props = { locale: Locale };

/**
 * The phone loses the desktop header, and with it the logo — this slim bar
 * carries the lockup back to the top of every screen below 744px. Ported
 * from mobileLogo(): publishes --sp-mhead-h (measured, not hard-coded, so
 * anything pinned below — Work's tabs, the company rail — stacks under it
 * correctly), tracks scroll to shrink the mark once the reader moves
 * (is-tight), and samples the surface behind it the same way Header does
 * (on-dark) so the mark stays legible over any section.
 */
export function Masthead({ locale }: Props) {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement | null>(null);
  const [isTight, setIsTight] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function size() {
      const h = Math.round(bar!.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--sp-mhead-h", `${h}px`);
    }
    window.addEventListener("resize", size);
    size();

    // A small dead band keeps the mark from flickering on a rubber-band
    // scroll bounce: it opens large, then settles small once the reader
    // has actually moved.
    function tight() {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setIsTight((prev) => (prev ? y >= 8 : y > 24));
    }
    window.addEventListener("scroll", tight, { passive: true });
    tight();

    let queued = false;
    function read() {
      queued = false;
      parkAboveFooter([bar, document.querySelector<HTMLElement>(".header")]);
      const r = bar!.querySelector(".lockup")?.getBoundingClientRect();
      if (!r) return;
      const xs = [r.left + 4, r.left + r.width / 2, r.right - 4];
      const y = r.top + r.height / 2;
      const dark = isDarkAt(xs, y, bar!);
      setIsDark(dark ?? false);
    }
    function ask() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    }
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    ask();
    const t = setTimeout(read, 400);

    return () => {
      window.removeEventListener("resize", size);
      window.removeEventListener("scroll", tight);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      clearTimeout(t);
    };
    // Re-measure and re-sample on navigation — new content sits behind it.
  }, [pathname]);

  const classes = ["sp-mhead", isTight && "is-tight", isDark && "on-dark"].filter(Boolean).join(" ");

  return (
    <div ref={barRef} className={classes}>
      <Link className="lockup" href={withLocale("/", locale)} aria-label="W Labs">
        <img
          className="logo-h"
          src={isDark ? "/site/logo/secondary-land.svg" : "/site/logo/primary-land.svg"}
          alt="W Labs"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
