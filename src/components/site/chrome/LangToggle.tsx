"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { useLangTargets } from "./LangTargetContext";

type Props = { locale: Locale; s: SiteStrings["chrome"] };

// WOS-383: switching language keeps the reader's place. Without this the
// toggle is a plain route change, so Next.js scrolls the new locale to the
// top. Instead the link opts out of that scroll, and before navigating we
// remember which heading the reader had just passed and how far past it
// they were; once the other language renders we scroll to that same
// heading plus the same distance. KO and EN wrap differently, so page
// heights differ — anchoring to a heading (both languages render the same
// headings in the same order) lands on the same content where a raw
// scrollY would not.
const LANG_ANCHOR_KEY = "wl-lang-anchor";
const HEADINGS = "main h1, main h2, main h3";

function rememberAnchor(targetPath: string) {
  const hs = Array.from(document.querySelectorAll<HTMLElement>(HEADINGS));
  let index = -1;
  for (let i = 0; i < hs.length; i++) {
    if (hs[i].getBoundingClientRect().top <= 1) index = i;
    else break;
  }
  const offset = index >= 0 ? -hs[index].getBoundingClientRect().top : window.scrollY;
  try {
    sessionStorage.setItem(LANG_ANCHOR_KEY, JSON.stringify({ path: targetPath, index, offset }));
  } catch {
    // storage unavailable (private mode): the switch still works, it just lands at the top
  }
}

function useRestoreLangScroll(pathname: string) {
  useLayoutEffect(() => {
    let saved: { path: string; index: number; offset: number } | null = null;
    try {
      const raw = sessionStorage.getItem(LANG_ANCHOR_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      return;
    }
    if (!saved || saved.path !== pathname) return;
    sessionStorage.removeItem(LANG_ANCHOR_KEY);
    const { index, offset } = saved;
    const restore = () => {
      const h = index >= 0 ? document.querySelectorAll<HTMLElement>(HEADINGS)[index] : null;
      const top = h ? h.getBoundingClientRect().top + window.scrollY + offset : offset;
      window.scrollTo({ top, behavior: "instant" });
    };
    restore();
    // late images and fonts can still move the page; settle once more
    requestAnimationFrame(() => requestAnimationFrame(restore));
  }, [pathname]);
}

/**
 * The language toggle floats over the page, which is right everywhere
 * except the very bottom, where at its usual offset it would land on top
 * of the legal lines. Ported from langDock(): it docks into the footer's
 * own margin above .foot-legal's hairline instead, stopping exactly where
 * its own bottom edge would cross it.
 */
export function LangToggle({ locale, s }: Props) {
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

  useRestoreLangScroll(pathname);

  const targets = useLangTargets();

  const prefix = `/${locale}`;
  const rel = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  // WOS-346: a page can override where its other-language version lives
  // (AISEN posts publish each language independently, possibly under a
  // different slug). An explicit href wins; `null` means "no such version"
  // and falls back to that locale's insights list rather than a 404; pages
  // that set nothing keep the plain prefix swap.
  const hrefFor = (target: Locale) => {
    const t = targets[target];
    if (typeof t === "string") return t;
    if (t === null) return withLocale("/company/insights", target);
    return `/${target}${rel === "" ? "" : rel}`;
  };

  return (
    <div ref={elRef} className="lang lang-float" role="group" aria-label={s.langGroup}>
      {(["en", "ko"] as const).map((l) => {
        const href = hrefFor(l);
        return (
          <Link
            key={l}
            href={href}
            scroll={false}
            aria-pressed={locale === l}
            lang={l}
            onClick={() => {
              if (l !== locale) rememberAnchor(href);
            }}
          >
            {l.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
