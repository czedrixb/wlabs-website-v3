import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

type Props = { locale: Locale };

// The inquiry/partnership buttons and the privacy/terms links point at the
// contact sheet and a company panel in v3 — that modal system and those
// legal pages don't exist yet (WOS-314 Step 4 scope is chrome + Home only),
// so for now they resolve to real routes instead of opening anything.
//
// Server component — reads the dictionary itself rather than taking it as
// a prop, since (unlike Header/TabBar/LangToggle) nothing here needs to run
// in the browser.
export function Footer({ locale }: Props) {
  const s = siteT(locale).chrome;

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
            <Link href={withLocale("/contact", locale)}>{s.ctaDiscuss}</Link>
            <Link href={withLocale("/contact", locale)}>{s.partner}</Link>
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
