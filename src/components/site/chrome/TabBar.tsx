"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";

type Props = { locale: Locale };

function siteRelativePath(pathname: string, locale: Locale): string {
  const prefix = `/${locale}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  return rest === "" ? "/" : rest;
}

function isActive(href: string, relPath: string): boolean {
  if (href === "/") return relPath === "/";
  return relPath === href || relPath.startsWith(`${href}/`);
}

const TABS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v10h13V10" />
      </>
    ),
  },
  {
    href: "/work",
    label: "하는 일",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),
  },
  {
    href: "/company",
    label: "회사",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15.5 14.5a5 5 0 0 1 6 5" />
      </>
    ),
  },
  {
    href: "/search",
    label: "검색",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
  {
    href: "/contact",
    label: "문의",
    interactive: true,
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
];

/**
 * The mobile tab bar's own notch — same object as the desktop nav pill,
 * mirrored: the pane sits behind the tabs and the active tab bites a notch
 * out of its TOP edge. Ported from tabPane(); it needs a real element to
 * paint (.sp-tabpane) which JS measures against the active tab's label.
 */
export function TabBar({ locale }: Props) {
  const pathname = usePathname();
  const relPath = siteRelativePath(pathname, locale);
  const barRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    function place() {
      const a = bar!.querySelector<HTMLAnchorElement>(".tab[aria-current]");
      if (!a) return;
      // The notch tracks the label, not the whole fifth of the bar.
      const label = a.querySelector("span:not(.badge)") ?? a;
      const range = document.createRange();
      range.selectNodeContents(label);
      const r = range.getBoundingClientRect();
      const b = bar!.getBoundingClientRect();
      const w = Math.max(26, Math.round(r.width));
      const x = Math.round(r.left - b.left + (r.width - w) / 2);
      bar!.style.setProperty("--x", `${x}px`);
      bar!.style.setProperty("--w", `${w}px`);
    }
    place();
    const t = setTimeout(place, 300);
    window.addEventListener("resize", place);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", place);
    };
  }, [relPath]);

  return (
    <nav ref={barRef} className="tabbar" aria-label="주 메뉴">
      <span className="sp-tabpane" aria-hidden="true" />
      <ul>
        {TABS.map((tab) => {
          const active = isActive(tab.href, relPath);
          return (
            <li key={tab.href}>
              <Link
                className={tab.interactive ? "tab interactive" : "tab"}
                href={withLocale(tab.href, locale)}
                aria-current={active ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {tab.icon}
                </svg>
                <span>{tab.label}</span>
                {tab.interactive && <i className="badge" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
