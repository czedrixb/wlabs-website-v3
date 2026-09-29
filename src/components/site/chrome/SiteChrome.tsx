import type { Locale } from "@/lib/locale";
import { siteFontVariables } from "@/lib/fonts";
import { siteT } from "@/lib/site/dictionary";
import { Header } from "./Header";
import { Masthead } from "./Masthead";
import { TabBar } from "./TabBar";
import { Footer } from "./Footer";
import { LangToggle } from "./LangToggle";
import { OrganizationJsonLd } from "./OrganizationJsonLd";

type Props = { locale: Locale; children: React.ReactNode };

// WOS-335: the v3 site's chrome, extracted out of (site)/layout.tsx so both
// (site) AND (blog) can wrap their pages in it. Ordering is load-bearing —
// LangToggle docks itself against `footer .foot-legal` and Masthead calls
// parkAboveFooter() over `.header` — so this is a shared component rather
// than JSX copied into two layouts, which would risk the two drifting apart.
//
// Server component: only Header/Masthead/TabBar/LangToggle are 'use client'
// themselves; this wrapper just arranges them and needs no browser APIs.
//
// Does NOT import "@/styles/site.css" — that import stays in each calling
// layout so Next's per-segment CSS loading still attributes the stylesheet
// to whichever route group is actually rendering it.
export function SiteChrome({ locale, children }: Props) {
  const chrome = siteT(locale).chrome;

  return (
    <div className={siteFontVariables}>
      <OrganizationJsonLd locale={locale} description={chrome.legal2} />
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
