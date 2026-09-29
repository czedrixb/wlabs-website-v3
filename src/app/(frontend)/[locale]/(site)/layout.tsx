import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteFontVariables } from "@/lib/fonts";
import { siteT } from "@/lib/site/dictionary";
import { Header } from "@/components/site/chrome/Header";
import { Masthead } from "@/components/site/chrome/Masthead";
import { TabBar } from "@/components/site/chrome/TabBar";
import { Footer } from "@/components/site/chrome/Footer";
import { LangToggle } from "@/components/site/chrome/LangToggle";
import "@/styles/site.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Overrides the shared [locale] root layout's blog-titled metadata (that
// one still applies to the (blog) group, which sets none of its own) for
// every route in this group — see [locale]/layout.tsx's own comment on
// this. legal2 is v3's own tagline ("성장과 디지털 전환의 파트너" / "Partner
// for growth and digital transformation") — the same string Footer.tsx
// already renders, reused here rather than a separate title-only key.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const { chrome } = siteT(resolveLocale(localeParam));
  return { title: `W Labs — ${chrome.legal2}`, description: chrome.legal2 };
}

// The v3 site's own chrome — header/masthead/tab bar/footer/language float —
// wraps every non-blog page. siteFontVariables (src/lib/fonts.ts) is applied
// here rather than on the shared [locale] root layout, so the blog group
// never pulls in Quicksand/Raleway/Noto Sans KR or site.css.
export default async function SiteLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const chrome = siteT(locale).chrome;

  return (
    <div className={siteFontVariables}>
      <a className="skip" href="#main">
        {chrome.skip}
      </a>
      <Header locale={locale} s={chrome} />
      <Masthead locale={locale} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
      <TabBar locale={locale} s={chrome} />
      <LangToggle locale={locale} s={chrome} />
    </div>
  );
}
