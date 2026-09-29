import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { PRODUCTS, PRODUCT_ORDER, type ProductId } from "@/lib/site/content";

type Props = { locale: Locale; s: SiteStrings["home"] };

// WOS-336: Home's products 3-card preview (v3 index.html:2313-2342) —
// SkinArch / WIZ Assistant / BrainArch with the inline SVG art, tag +
// Research-use-only badges and the price/subscription foot. Sits between
// the services Band and the project strip, v3's own order.
//
// The three artworks are copied verbatim from the source, with one change:
// gradient ids are prefixed `hp-` (v3's `g-skin`/`g-brain` are
// document-global ids — unprefixed they'd be one duplicate-id away from
// resolving against the wrong element). The tag/RUO labels are literal
// English in v3's markup (no data-i, both languages) — reproduced as such.
const ART: Record<ProductId, React.ReactNode> = {
  skinarch: (
    <svg viewBox="0 0 300 120">
      <defs>
        <linearGradient id="hp-g-skin" x1="0" x2="1">
          <stop offset="0" stopColor="#0E5B6E" stopOpacity=".9" />
          <stop offset="1" stopColor="#1A9BB1" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#hp-g-skin)" strokeWidth="1.4">
        <path d="M10 40q40-22 75 0t75 0 75 0 55 0" />
        <path d="M10 62q40-22 75 0t75 0 75 0 55 0" opacity=".7" />
        <path d="M10 84q40-22 75 0t75 0 75 0 55 0" opacity=".45" />
        <path d="M10 106q40-22 75 0t75 0 75 0 55 0" opacity=".25" />
      </g>
      <path d="M150 12v100" stroke="#141A2E" strokeDasharray="3 5" opacity=".4" />
      <circle cx="150" cy="62" r="4" fill="#0E5B6E" />
    </svg>
  ),
  wiz: (
    <svg viewBox="0 0 300 120">
      <rect x="30" y="18" width="150" height="34" rx="17" fill="#fff" stroke="#D6EBEF" />
      <rect x="120" y="66" width="150" height="34" rx="17" fill="#0E5B6E" />
      <circle cx="52" cy="35" r="5" fill="#1A9BB1" />
      <rect x="66" y="31" width="90" height="8" rx="4" fill="#D6EBEF" />
      <rect x="138" y="79" width="70" height="8" rx="4" fill="#7FE1F5" />
      <rect x="214" y="79" width="40" height="8" rx="4" fill="#7FE1F5" opacity=".6" />
    </svg>
  ),
  brainarch: (
    <svg viewBox="0 0 300 120">
      <defs>
        <radialGradient id="hp-g-brain">
          <stop offset="0" stopColor="#1A9BB1" stopOpacity=".5" />
          <stop offset="1" stopColor="#1A9BB1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="60" rx="70" ry="48" fill="url(#hp-g-brain)" />
      <ellipse cx="150" cy="60" rx="70" ry="48" fill="none" stroke="#0E5B6E" strokeWidth="1.4" />
      <ellipse cx="150" cy="60" rx="46" ry="30" fill="none" stroke="#0E5B6E" strokeWidth="1" opacity=".6" />
      <path d="M150 12v96M80 60h140" stroke="#141A2E" strokeDasharray="3 5" opacity=".35" />
      <circle cx="168" cy="48" r="5" fill="#0E5B6E" />
    </svg>
  ),
};

export function ProductsPreview({ locale, s }: Props) {
  const blurbs: Record<ProductId, string> = { skinarch: s.p1, wiz: s.p2, brainarch: s.p3 };

  return (
    <div className="section wrap" style={{ paddingTop: 0 }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">{s.prodEyebrow}</span>
          <h2 style={{ marginTop: 12 }}>{s.prodH2}</h2>
        </div>
        <p className="lead">{s.prodLead}</p>
      </div>
      <div className="cards">
        {PRODUCT_ORDER.map((id) => {
          const product = PRODUCTS[id];
          const href = withLocale(`/products/${id}`, locale);
          return (
            <article className="card" key={id}>
              <div className="art" aria-hidden="true">
                {ART[id]}
              </div>
              <div className="tag">
                <span>{product.cat.en}</span>
                {product.ruo && <span className="ruo">Research use only</span>}
              </div>
              <h3>
                <Link href={href}>{product.name}</Link>
              </h3>
              <p>{blurbs[id]}</p>
              <div className="foot">
                <span className="small">{product.priceKey === "monthly" ? s.monthly : s.priceAsk}</span>
                <Link className="link" href={href}>
                  <span>{s.productPage}</span> →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
