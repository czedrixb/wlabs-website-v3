import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

type Props = { locale: Locale };

// The inquiry/partnership/newsletter links carry `data-contact`, so with JS
// they open the site-wide contact sheet preselected to that topic (WOS-336,
// v3's footer buttons at index.html:3107) and without JS they still resolve
// to /contact. The privacy/terms links point at a company panel in v3 —
// those legal pages still don't exist, so they keep resolving to /company.
//
// Server component — reads the dictionary itself rather than taking it as
// a prop, since (unlike Header/TabBar/LangToggle) nothing here needs to run
// in the browser.
export function Footer({ locale }: Props) {
  const strings = siteT(locale);
  const s = strings.chrome;

  return (
    <footer>
      <div className="wrap">
        <Link className="lockup foot-lockup" href={withLocale("/", locale)} aria-label="W Labs">
          {/* Plain <img>, deliberately — an SVG logo, not photography.
              WOS-334's next/image switch is scoped to product/team
              photography (TeamGrid/CompanyTeaser/products' visual); Next's
              optimizer can't improve an SVG and warns on it. */}
          <img className="logo-h" src="/site/logo/primary-land.svg" alt="W Labs" aria-hidden="true" />
        </Link>

        <nav className="sitemap" aria-label={s.sitemapLabel}>
          <div>
            <h4>
              <Link href={withLocale("/work", locale)}>{s.tabWork}</Link>
            </h4>
            <Link href={withLocale("/work/services", locale)}>{s.segServices}</Link>
            <Link href={withLocale("/work/products", locale)}>{s.segProducts}</Link>
            <Link href={withLocale("/work/cases", locale)}>{s.segCases}</Link>
          </div>
          <div>
            <h4>
              <Link href={withLocale("/company", locale)}>{s.tabCompany}</Link>
            </h4>
            <Link href={withLocale("/company/story", locale)}>{s.story}</Link>
            <Link href={withLocale("/company/team", locale)}>{s.team}</Link>
            <Link href={withLocale("/company/insights", locale)}>{s.insights}</Link>
            <Link href={withLocale("/blog", locale)}>{s.tabBlog}</Link>
          </div>
          <div>
            <h4>
              <Link href={withLocale("/contact", locale)}>{s.tabContact}</Link>
            </h4>
            <Link href={withLocale("/contact", locale)} data-contact="general">
              {s.ctaDiscuss}
            </Link>
            <Link href={withLocale("/contact", locale)} data-contact="partnership">
              {s.partner}
            </Link>
            <Link href={withLocale("/contact", locale)} data-contact="newsletter">
              {strings.home.ctaNews}
            </Link>
          </div>
          <div>
            <h4>{s.legalHead}</h4>
            <Link href={withLocale("/company", locale)}>{s.privacy}</Link>
            <Link href={withLocale("/company", locale)}>{s.terms}</Link>
            <Link href={withLocale("/search", locale)}>{s.tabSearch}</Link>
          </div>
        </nav>

        <div className="foot-legal">
          <div className="foot-biz">
            <span>{s.legal1}</span>
            <span>{s.legalAddr}</span>
            <span>{s.legal2}</span>
          </div>
          <div className="foot-meta">
            <span>© 2026 W Labs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
