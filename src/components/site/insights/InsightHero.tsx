import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { InsightShot } from "@/lib/site/insightArticles";

// WOS-342: the article's cover banner — v3's renderInsight hero
// (wlabs-01-wired.html:1902-1908). Full-bleed navy with the cyan radial
// glows, rendered OUTSIDE .wrap (only its inner copy is contained); an
// optional capture paints the right half ≥860px / spans the hero under a
// dark scrim below, and a mark variant sits on its own light plate
// (site.css's .ins-hero block). The sticky header's luminance sampler
// flips itself to .is-dark over the navy on its own (Header.tsx).
type Props = {
  locale: Locale;
  s: SiteStrings["insights"];
  cats: string[];
  title: string;
  dek?: string;
  meta?: string;
  shot?: InsightShot;
};

export function InsightHero({ locale, s, cats, title, dek, meta, shot }: Props) {
  return (
    <div className={shot ? "ins-hero on-navy has-shot" : "ins-hero on-navy"}>
      {shot && (
        <span
          className={shot.isMark ? "ins-shot is-mark" : "ins-shot"}
          aria-hidden="true"
          style={{ "--shot": `url(${shot.src})` } as React.CSSProperties}
        />
      )}
      <div className="wrap">
        <nav className="crumbs" aria-label="breadcrumb">
          <Link href={withLocale("/company/story", locale)}>{s.crumbCompany}</Link>
          <span>/</span>
          <Link href={withLocale("/company/insights", locale)}>{s.crumbInsights}</Link>
        </nav>
        {cats.length > 0 && (
          <div className="ins-cats">
            {cats.map((c) => (
              <span className="c" key={c}>
                {c}
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {dek && <p className="ins-dek">{dek}</p>}
        {meta && <p className="ins-meta">{meta}</p>}
      </div>
    </div>
  );
}
