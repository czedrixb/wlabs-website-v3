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
              optimizer can't improve an SVG and warns on it.
              WOS-351: the mono ink variant — v3's footer lockup is
              `#logo-h-ink` (index.html:3347), not the multicolor mark the
              header carries. */}
          <img className="logo-h" src="/site/logo/land-dark.svg" alt="W Labs" aria-hidden="true" />
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

        {/* WOS-351: the social row v3 places between the sitemap and the
            legal block (index.html:3354-3358) — same accounts, same icons. */}
        <div className="foot-social">
          <a href="https://www.facebook.com/wsoftlabs/" target="_blank" rel="noopener noreferrer" aria-label="W Labs — Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C18.6274 0 24 5.37259 24 12C24 18.1352 19.3955 23.1944 13.4538 23.9121V15.667L16.7001 15.667L17.3734 12H13.4538V10.7031C13.4538 9.73417 13.6439 9.06339 14.0799 8.63483C14.5159 8.20627 15.1979 8.01993 16.1817 8.01993C16.4307 8.01993 16.6599 8.02241 16.8633 8.02736C17.1591 8.03456 17.4002 8.047 17.568 8.06467V4.74048C17.501 4.72184 17.4218 4.70321 17.3331 4.68486C17.1321 4.6433 16.8822 4.60324 16.6136 4.56806C16.0523 4.49453 15.4093 4.4423 14.9594 4.4423C13.1424 4.4423 11.7692 4.83102 10.8107 5.63619C9.65388 6.60791 9.10108 8.18622 9.10108 10.4199V12H6.62659V15.667H9.10108V23.6466C3.87432 22.3498 0 17.6277 0 12C0 5.37259 5.37259 0 12 0Z" />
            </svg>
            Facebook
          </a>
          <a href="https://www.linkedin.com/company/w-labs-inc/posts/" target="_blank" rel="noopener noreferrer" aria-label="W Labs — LinkedIn">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z" />
            </svg>
            LinkedIn
          </a>
          <a href="https://www.instagram.com/wsoftlabs/" target="_blank" rel="noopener noreferrer" aria-label="W Labs — Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.3952 7.02212C17.6005 7.02368 16.9543 6.3802 16.9528 5.58548C16.9512 4.79076 17.5947 4.14457 18.3898 4.14302C19.1848 4.14146 19.831 4.78531 19.8326 5.58004C19.8338 6.37476 19.1903 7.02057 18.3952 7.02212Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0115 18.161C8.60909 18.1676 5.8451 15.4149 5.8385 12.0117C5.83188 8.60923 8.58536 5.84481 11.9878 5.8382C15.3909 5.83159 18.1553 8.5859 18.1619 11.9879C18.1685 15.3912 15.4143 18.1544 12.0115 18.161ZM11.992 8.00035C9.78365 8.00424 7.99594 9.79858 7.99983 12.0074C8.0041 14.2166 9.79882 16.0039 12.0072 15.9996C14.2164 15.9954 16.0041 14.2014 15.9998 11.9922C15.9955 9.78302 14.2008 7.99608 11.992 8.00035Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M4.1192 0.646479C4.88126 0.347876 5.75333 0.143362 7.03015 0.0830982C8.31011 0.0216726 8.71872 0.00767102 11.9769 0.00145262C15.2358 -0.00476578 15.6444 0.00766862 16.9244 0.0644334C18.2016 0.119643 19.0741 0.321049 19.8377 0.616544C20.6277 0.920974 21.298 1.33078 21.966 1.99603C22.6339 2.66205 23.0453 3.33002 23.3536 4.1189C23.6518 4.88174 23.8563 5.75306 23.917 7.03068C23.9776 8.31023 23.9924 8.71847 23.9986 11.9771C24.0048 15.2353 23.9916 15.6443 23.9356 16.925C23.88 18.2014 23.679 19.0743 23.3835 19.8375C23.0783 20.6276 22.6693 21.2979 22.004 21.9659C21.3388 22.6342 20.6701 23.0452 19.8812 23.3539C19.1184 23.6517 18.2471 23.8562 16.9702 23.9173C15.6903 23.9779 15.2817 23.9923 12.0224 23.9985C8.76459 24.0048 8.35598 23.9923 7.07605 23.9359C5.79882 23.88 4.92597 23.6789 4.16275 23.3838C3.37271 23.0782 2.70242 22.6696 2.03446 22.004C1.36611 21.3383 0.954386 20.67 0.646458 19.8811C0.347858 19.1186 0.144107 18.2469 0.0830727 16.9705C0.0220359 15.6901 0.00765506 15.2811 0.00143906 12.0229C-0.00480094 8.76435 0.00803667 8.35611 0.0640167 7.07616C0.1204 5.79855 0.320637 4.92606 0.61613 4.16206C0.921328 3.37239 1.33035 2.70248 1.99637 2.03413C2.6616 1.36616 3.33033 0.954017 4.1192 0.646479ZM4.94154 21.3679C5.36494 21.5308 6.00023 21.7252 7.17014 21.7761C8.43607 21.8309 8.81514 21.843 12.0185 21.8368C15.223 21.8309 15.6021 21.8173 16.8676 21.7579C18.0363 21.7022 18.6716 21.5055 19.0939 21.3407C19.6541 21.1218 20.0531 20.8601 20.4722 20.4406C20.8913 20.0195 21.1506 19.6194 21.3676 19.0591C21.5309 18.6354 21.7249 17.9996 21.7758 16.8297C21.8314 15.5646 21.8431 15.1851 21.8368 11.9809C21.831 8.77757 21.8174 8.3981 21.7572 7.13254C21.7019 5.96339 21.5056 5.32808 21.3404 4.90623C21.1215 4.34519 20.8606 3.94705 20.4399 3.52753C20.0192 3.10801 19.6191 2.84945 19.0581 2.6325C18.6355 2.46881 17.9994 2.27518 16.8303 2.22426C15.5643 2.16865 15.1849 2.15737 11.9808 2.1636C8.77743 2.16982 8.39836 2.18264 7.13281 2.24253C5.9633 2.29812 5.32877 2.49447 4.90575 2.65972C4.34587 2.87861 3.94696 3.13872 3.52746 3.5598C3.10871 3.98087 2.84938 4.38018 2.63244 4.94161C2.46993 5.36464 2.27434 6.00072 2.2242 7.16987C2.16898 8.43581 2.15733 8.81529 2.16355 12.0187C2.16939 15.2228 2.18298 15.6023 2.24248 16.8671C2.29729 18.037 2.49518 18.6715 2.65966 19.0949C2.87855 19.6544 3.13944 20.0533 3.55973 20.4729C3.98081 20.8908 4.38088 21.1509 4.94154 21.3679Z" />
            </svg>
            Instagram
          </a>
        </div>

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
