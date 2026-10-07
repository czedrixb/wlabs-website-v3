import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteOpenGraphDefaults } from "@/lib/site/metadata";
import { SiteChrome } from "@/components/site/chrome/SiteChrome";
import "@/styles/site.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Overrides the shared [locale] root layout's metadata for every route in
// this group — (blog) has its own generateMetadata now too (WOS-335), so
// neither group depends on being the other's fallback. legal2 is v3's own
// tagline ("성장과 디지털 전환의 파트너" / "Partner for growth and digital
// transformation") — the same string Footer.tsx already renders, reused
// here rather than a separate title-only key.
//
// WOS-343: spreads siteOpenGraphDefaults so a leaf page that defines no
// generateMetadata of its own (company/page.tsx, work/page.tsx — their own
// [panel] siblings DO call siteMetadata and replace this wholesale) still
// carries metadataBase + openGraph + twitter instead of nothing at all.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { chrome } = siteT(locale);
  return {
    title: `W Labs — ${chrome.legal2}`,
    description: chrome.legal2,
    ...siteOpenGraphDefaults(locale, chrome.legal2),
  };
}

// The v3 site's own chrome — header/masthead/tab bar/footer/language float,
// via the shared <SiteChrome> (src/components/site/chrome/SiteChrome.tsx),
// which the (blog) group's own layout now also wraps its pages in (WOS-335).
// The site.css import above stays in each calling layout rather than moving
// into SiteChrome itself, so Next's per-segment CSS loading still
// attributes the stylesheet to whichever route group is actually rendering.
export default async function SiteLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);

  return <SiteChrome locale={locale}>{children}</SiteChrome>;
}
