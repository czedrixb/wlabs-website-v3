import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { PRODUCTS, PRODUCT_ORDER, type ProductId } from "@/lib/site/content";

type Props = { locale: Locale; s: SiteStrings["home"] };

// WOS-336: Home's products 3-card preview (v3 index.html:2313-2342) —
// SkinArch / WIZ Assistant / BrainArch with the real product capture in
// the art slot, tag + Research-use-only badges and the price/subscription
// foot. Sits between the services Band and the project strip, v3's own
// order.
//
// v3 ships the captures inline (`SP_SHOT`, theme8) and applies each as a
// `--shot` custom property that `.sp-shot` paints `center/cover` into a
// 16:10 slot; the same files live at public/site/img/<id>.webp here, so
// the slot is rendered directly with the class + property instead of
// being injected by a script.
function shotStyle(id: ProductId): React.CSSProperties {
  return { "--shot": `url(/site/img/${id}.webp)` } as React.CSSProperties;
}

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
              <div className="art sp-shot" aria-hidden="true" style={shotStyle(id)} />
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
