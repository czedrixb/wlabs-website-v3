import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { SiteChrome } from "@/components/site/chrome/SiteChrome";
import "@/styles/site.css";

// This used to be the (frontend) group's own [locale]/layout.tsx fallback
// (WOS-313's standalone-prototype title, applying here because (blog) set
// none of its own). WOS-335 gives (blog) its own generateMetadata, same as
// (site)/layout.tsx already had, so neither group depends on the other.
const BLOG_METADATA: Record<Locale, Metadata> = {
  ko: { title: "W Labs 블로그", description: "W Labs 블로그" },
  en: { title: "W Labs Blog", description: "W Labs blog" },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return BLOG_METADATA[resolveLocale(locale)];
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
  const locale: Locale = resolveLocale(localeParam);

  return <SiteChrome locale={locale}>{children}</SiteChrome>;
}
