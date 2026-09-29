"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { isDarkAt } from "./lib/surfaceSampler";
import { NAV_ITEMS } from "./siteNav";

type Props = { locale: Locale };

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

export function Header({ locale }: Props) {
  const pathname = usePathname();
  const relPath = siteRelativePath(pathname, locale);

  const headerRef = useRef<HTMLElement | null>(null);
  const ulRef = useRef<HTMLUListElement | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  // Luminance sampler: read what actually paints behind the lockup/nav and
  // flip .is-dark so it stays legible — same technique as Masthead, ported
  // from the built site's separate desktop `check()` function.
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
      const y = r.bottom - 1;
      const xs = [r.left + r.width * 0.12, r.left + r.width * 0.5, r.left + r.width * 0.85];
      const dark = isDarkAt(xs, y, header!);
      if (dark !== null) setIsDark(dark);
    }
    function ask() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    }

    ask();
    const t = setTimeout(read, 400);
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
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
          <img
            className="logo-h"
            src={isDark ? "/site/logo/secondary-land.svg" : "/site/logo/primary-land.svg"}
            alt="W Labs"
            aria-hidden="true"
          />
        </Link>
        <nav aria-label="주 메뉴">
          <ul ref={ulRef}>
            <span className="sp-navpane" aria-hidden="true" />
            {NAV_ITEMS.map((item) => {
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
                    <ul className="sub" aria-label={`${item.label} 하위 메뉴`}>
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
