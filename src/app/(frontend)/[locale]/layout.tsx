import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/locale";

// This is the blog's default metadata (WOS-313's own title before the v3
// site landed) — it applies wherever a page doesn't set its own, which
// today is every (blog) route. It used to be a single static object
// reporting "W Labs Blog" on every locale AND on every (site) route too
// (WOS-331 fix: (site)/layout.tsx now has its own generateMetadata below,
// which Next's metadata merging overrides this with for that group).
const BLOG_METADATA: Record<"ko" | "en", Metadata> = {
  ko: { title: "W Labs 블로그", description: "W Labs 블로그 — 스탠드얼론 프로토타입 (WOS-313)" },
  en: { title: "W Labs Blog", description: "W Labs blog — standalone prototype (WOS-313)" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return BLOG_METADATA[resolveLocale(locale)];
}

// Hints Next's build-time optimizer at the two real locales; on its own it
// does NOT reject anything else — dynamicParams: false only 404s params
// missing from this list for statically-generated routes. That used to be
// moot because every page under here was `force-dynamic`; since WOS-314's
// (site) group landed that's no longer true — its 10 routes declare no
// `dynamic`/`revalidate` and prerender statically at build (only (blog)'s
// two routes stay force-dynamic). Either way, an unknown segment (e.g.
// /fr/blog) would still render rather than 404 on this mechanism alone
// (dynamicParams defaults to true) — the explicit check below is the real
// enforcement, for both groups.
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Root layout for the whole (frontend) group: the blog and, once WOS-314's
// v3 port lands, the site shell both nest under this for their <html lang>.
// Body styling/stylesheets are left to each nested layout ((blog) uses
// Tailwind; the future (site) group brings its own tokens) rather than
// applied here, so the two can never fight over one shared body class list.
export default async function LocaleRootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (locale !== "ko" && locale !== "en") notFound();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
