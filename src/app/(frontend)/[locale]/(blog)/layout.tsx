import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { isSupportedLocale, resolveLocale } from "@/lib/locale";
import { siteOpenGraphDefaults } from "@/lib/site/metadata";
import { SiteChrome } from "@/components/site/chrome/SiteChrome";
import "@/styles/site.css";

// This used to be the (frontend) group's own [locale]/layout.tsx fallback
// (WOS-313's standalone-prototype title, applying here because (blog) set
// none of its own). WOS-335 gives (blog) its own generateMetadata, same as
// (site)/layout.tsx already had, so neither group depends on the other.
// WOS-342: the group now serves /insights/{slug} (the detail URL moved off
// /blog/{slug}), so the fallback naming follows.
const BLOG_METADATA: Record<Locale, Metadata> = {
  ko: { title: "W Labs 인사이트", description: "W Labs 인사이트" },
  en: { title: "W Labs Insights", description: "W Labs insights" },
};

// WOS-343: spreads siteOpenGraphDefaults — insights/[slug]/page.tsx DOES
// call siteMetadata and replaces this wholesale for its own route, but this
// is the group's only metadata source for anything that isn't a detail
// page (there is none today, but this keeps the group self-sufficient the
// way (site)/layout.tsx now is too).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const base = BLOG_METADATA[locale];
  return { ...base, ...siteOpenGraphDefaults(locale, base.description as string) };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// WOS-335: the blog now wraps its pages in the same <SiteChrome> as every
// (site) route and imports the same site.css tokens/fonts, so it reads as a
// section of the renewed site instead of the WOS-313 standalone prototype's
// own Tailwind skin. See src/components/site/chrome/SiteChrome.tsx.
export default async function BlogLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  // WOS-355: moved down from the frontend root layout. A layout.tsx's own
  // not-found.tsx sibling can't catch a throw from that same layout (the
  // boundary is nested inside it, same as error.js) — this one is caught by
  // the PARENT segment's boundary instead: src/app/(frontend)/[locale]/not-found.tsx,
  // which supplies its own SiteChrome since this layout never ran. See that
  // file and src/app/(frontend)/[locale]/layout.tsx.
  if (!isSupportedLocale(localeParam)) notFound();
  const locale: Locale = resolveLocale(localeParam);

  return <SiteChrome locale={locale}>{children}</SiteChrome>;
}
