import type { Locale } from "@/lib/locale";
import { siteFontVariables } from "@/lib/fonts";
import { siteT } from "@/lib/site/dictionary";
import { CHIP_TIPS, TOPICS } from "@/lib/site/content";
import { Header } from "./Header";
import { Masthead } from "./Masthead";
import { TabBar } from "./TabBar";
import { Footer } from "./Footer";
import { LangToggle } from "./LangToggle";
import { LogoSprite } from "./LogoSprite";
import { Toaster } from "./Toaster";
import { OrganizationJsonLd } from "./OrganizationJsonLd";
import { ContactSheet } from "@/components/site/contact/ContactSheet";
import { TipboxHost } from "@/components/site/modules/TipboxHost";

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
  const s = siteT(locale);
  const chrome = s.chrome;

  return (
    <div className={siteFontVariables}>
      {/* First in the tree so #logo-icon-* symbols exist before any <use>
          referencing them (Hero's dp-mark, the CTA panels' watermark). */}
      <LogoSprite />
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
      {/* WOS-336 singletons: the [data-contact] sheet, the toast, and the
          chip-glossary tooltip — one instance each for the whole page. */}
      <ContactSheet locale={locale} s={s.sheet} topics={TOPICS} />
      <Toaster />
      <TipboxHost tips={CHIP_TIPS.map((t) => ({ term: t.term, tip: locale === "en" ? t.tip.en : t.tip.ko }))} />
    </div>
  );
}
