"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// WOS-351: the (site) group's 404. Before this, an unknown site URL (bad
// product/project slug, mistyped path) fell through to Next's default
// unbranded 404 while /insights/* had a designed one — this closes that gap
// with the same visual language (navy ins-hero 404 head + ways out).
//
// not-found.tsx receives no params, so the locale comes off the pathname on
// the client, same as InsightNotFound. Copy is inline bilingual — the v3
// dictionary has no 404 strings (the prototype's hash router could not miss).
const STRINGS = {
  ko: {
    code: "404",
    title: "페이지를 찾을 수 없습니다",
    dek: "주소가 바뀌었거나 잘못 입력된 주소입니다. 아래에서 가시려던 곳을 찾아보세요.",
    requested: "요청한 주소",
    home: "홈으로",
    work: "하는 일 보기",
    search: "검색",
  },
  en: {
    code: "404",
    title: "Page not found",
    dek: "The address may have moved or was mistyped. The links below should get you back on track.",
    requested: "Requested address",
    home: "Back home",
    work: "See our work",
    search: "Search",
  },
};

export function SiteNotFound() {
  const pathname = usePathname() ?? "";
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko";
  const s = STRINGS[locale];

  return (
    <>
      <div className="ins-hero on-navy is-404">
        <div className="wrap">
          <p className="ins-404-code" aria-hidden="true">
            {s.code}
          </p>
          <h1>{s.title}</h1>
          <p className="ins-dek">{s.dek}</p>
          {pathname && (
            <p className="ins-meta">
              {s.requested}: <code>{decodeURIComponent(pathname)}</code>
            </p>
          )}
        </div>
      </div>
      <div className="wrap">
        <div className="ins-404-acts">
          <Link className="btn btn-primary" href={`/${locale}`}>
            <span>{s.home}</span>
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
          <Link className="btn btn-ghost" href={`/${locale}/work/services`}>
            <span>{s.work}</span>
          </Link>
          <Link className="btn btn-ghost" href={`/${locale}/search`}>
            <span>{s.search}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
