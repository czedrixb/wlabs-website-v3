"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";

type Props = { locale: Locale };

/**
 * The language toggle floats over the page, which is right everywhere
 * except the very bottom, where at its usual offset it would land on top
 * of the legal lines. Ported from langDock(): it docks into the footer's
 * own margin above .foot-legal's hairline instead, stopping exactly where
 * its own bottom edge would cross it.
 */
export function LangToggle({ locale }: Props) {
  const pathname = usePathname();
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let queued = false;
    function place() {
      queued = false;
      const leg = document.querySelector<HTMLElement>("footer .foot-legal");
      el!.style.bottom = "";
      if (!leg) return;
      const rest = parseFloat(getComputedStyle(el!).bottom) || 0;
      const top = leg.getBoundingClientRect().top;
      const dock = window.innerHeight - top + 14;
      if (dock > rest) el!.style.bottom = `${dock}px`;
    }
    function ask() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(place);
    }
    ask();
    const t = setTimeout(place, 400);
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      clearTimeout(t);
    };
  }, [pathname]);

  const prefix = `/${locale}`;
  const rel = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const hrefFor = (target: Locale) => `/${target}${rel === "" ? "" : rel}`;

  return (
    <div ref={elRef} className="lang lang-float" role="group" aria-label="언어 선택">
      <Link href={hrefFor("en")} aria-pressed={locale === "en"} lang="en">
        EN
      </Link>
      <Link href={hrefFor("ko")} aria-pressed={locale === "ko"} lang="ko">
        KO
      </Link>
    </div>
  );
}
