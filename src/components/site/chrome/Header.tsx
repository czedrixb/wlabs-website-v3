"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { isDarkAtLines } from "./lib/surfaceSampler";
import { buildNav } from "./siteNav";

type Props = { locale: Locale; s: SiteStrings["chrome"] };

// Strip the /ko or /en prefix so nav matching is locale-agnostic — "/ko/work/services"
// and "/en/work/services" both read as "/work/services".
function siteRelativePath(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  return rest === "" ? "/" : rest;
}

function isActive(itemHref: string, relPath: string): boolean {
  if (itemHref === "/") return relPath === "/";
  return relPath === itemHref || relPath.startsWith(`${itemHref}/`);
}

export function Header({ locale, s }: Props) {
  const pathname = usePathname();
  const relPath = siteRelativePath(pathname, locale);
  const navItems = buildNav(s);

  const headerRef = useRef<HTMLElement | null>(null);
  const ulRef = useRef<HTMLUListElement | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  // Luminance sampler: read what actually paints behind the mark and flip
  // .is-dark so it stays legible. WOS-336 brings this to full parity with
  // the built site's desktop `check()` (index.html:3638-3642): sample
  // points derive from the LOGO's own rect (left+4 / centre / right−4),
  // two y-lines are tried in order (logo centre, then the header's bottom
  // edge — alternatives, not averaged), an `.on-light` surface
  // short-circuits its inner dark panels, and in-page changes that fire no
  // scroll/resize (opening a band, a FAQ item, the sheet) are caught by a
  // click+60ms re-check and a 600ms interval.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let queued = false;

    function read() {
      queued = false;
      const r = header!.getBoundingClientRect();
      if (!r.height) {
        setIsDark(false);
        return;
      }
      const lr = header!.querySelector(".lockup")?.getBoundingClientRect() ?? null;
      const xs = lr
        ? [lr.left + 4, lr.left + lr.width / 2, lr.right - 4]
        : [r.left + r.width * 0.12, r.left + r.width * 0.5, r.left + r.width * 0.85];
      const ys = lr ? [lr.top + lr.height / 2, r.bottom - 1] : [r.bottom - 1];
      setIsDark(isDarkAtLines(xs, ys, header!));
    }
    function ask() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    }

    ask();
    const t = setTimeout(read, 400);
    const onClick = () => setTimeout(ask, 60);
    const interval = setInterval(ask, 600);
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      document.removeEventListener("click", onClick);
    };
    // Re-sample on navigation too — the sections behind the header changed.
  }, [pathname]);

  // The active tab's notch: measure its label and publish --x/--rx/--w on
  // the nav <ul>, which .sp-navpane's clip-path reads to cut its indent
  // under the current item. Ported from placeNotch(); the base shell's own
  // stroke-drawn notch (.nav-notch) is skipped — Depth's theme hides it
  // (site.css:1838, `stroke:none`) in favour of the glass pane.
  useEffect(() => {
    const ul = ulRef.current;
    if (!ul) return;
    function place() {
      const active = ul!.querySelector<HTMLAnchorElement>(":scope>li>a[aria-current]");
      if (!active) return;
      const r = active.getBoundingClientRect();
      const u = ul!.getBoundingClientRect();
      const w = Math.max(24, Math.round(r.width));
      const x = r.left - u.left + (r.width - w) / 2;
      const rx = u.width - (x + w);
      ul!.style.setProperty("--x", `${x}px`);
      ul!.style.setProperty("--rx", `${rx}px`);
      ul!.style.setProperty("--w", `${w}px`);
    }
    place();
    const t = setTimeout(place, 300);
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", place);
    };
  }, [relPath]);

  return (
    <header ref={headerRef} className={isDark ? "header is-dark" : "header"}>
      <div className="wrap">
        <Link className="lockup" href={withLocale("/", locale)} aria-label="W Labs">
          {/* Plain <img>, deliberately — SVG logo, out of scope for
              WOS-334's next/image switch (see Footer.tsx's own note). */}
          <img
            className="logo-h"
            src={isDark ? "/site/logo/secondary-land.svg" : "/site/logo/primary-land.svg"}
            alt="W Labs"
            aria-hidden="true"
          />
        </Link>
        <nav aria-label={s.navMain}>
          <ul ref={ulRef}>
            <span className="sp-navpane" aria-hidden="true" />
            {navItems.map((item) => {
              const active = isActive(item.href, relPath);
              const hasSub = Boolean(item.children?.length);
              return (
                <li
                  key={item.href}
                  className={hasSub ? (openSub === item.href ? "has-sub open" : "has-sub") : undefined}
                  onMouseEnter={hasSub ? () => setOpenSub(item.href) : undefined}
                  onMouseLeave={
                    hasSub
                      ? (e) => {
                          if (!e.currentTarget.contains(document.activeElement)) setOpenSub(null);
                        }
                      : undefined
                  }
                  onFocus={hasSub ? () => setOpenSub(item.href) : undefined}
                  onBlur={
                    hasSub
                      ? (e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenSub(null);
                        }
                      : undefined
                  }
                >
                  <Link
                    href={withLocale(item.href, locale)}
                    aria-current={active ? "page" : undefined}
                    aria-haspopup={hasSub ? "true" : undefined}
                  >
                    {item.label}
                  </Link>
                  {hasSub && (
                    <ul className="sub" aria-label={item.subAriaLabel}>
                      {item.children!.map((child) => (
                        <li key={child.href}>
                          <Link href={withLocale(child.href, locale)} onClick={() => setOpenSub(null)}>
                            <b>{child.label}</b>
                            {child.sub && <span className="cap">{child.sub}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
