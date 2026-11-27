import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { HOME_PRODUCT_ORDER, PRODUCTS, type ProductId } from "@/lib/site/content";
import { productShot } from "@/components/site/work/ProductCard";

type Props = { locale: Locale; s: SiteStrings["home"]; w: SiteStrings["work"] };

// WOS-336: Home's products 3-card preview (v3 index.html:2313-2342), with
// the real product capture in the art slot, tag + Research-use-only badges
// and the price/subscription foot. Sits between the services Band and the
// project strip, v3's own order.
//
// WOS-383: the line-up is now UNDULIX / Willy / 우리家 (HOME_PRODUCT_ORDER;
// WIZ Assistant and BrainArch stay on Work → Products), followed by a "See
// all products" link like the project strip's. Willy and 우리家 share the
// Work panel's pp5/pp4 blurbs, as v3 does.
//
// v3 ships the captures inline (`SP_SHOT`, theme8) and applies each as a
// `--shot` custom property that `.sp-shot` paints `center/cover` into a
// 16:10 slot; the same files live at public/site/img/<id>.webp here, so
// the slot is rendered directly with the class + property instead of
// being injected by a script.
export function ProductsPreview({ locale, s, w }: Props) {
  const blurbs: Partial<Record<ProductId, string>> = { skinarch: s.p1, familytree: w.pp4, willy: w.pp5 };

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
        {HOME_PRODUCT_ORDER.map((id) => {
          const product = PRODUCTS[id];
          const href = withLocale(`/products/${id}`, locale);
          return (
            <article className="card" key={id}>
              <div className="art sp-shot" aria-hidden="true" style={productShot(id)} />
              <div className="tag">
                <span>{locale === "en" ? product.cat.en : product.cat.ko}</span>
                {product.ruo && <span className="ruo">Research use only</span>}
                {product.dev && <span className="ruo">{w.inDev}</span>}
              </div>
              <h3>
                <Link href={href}>{product.name}</Link>
              </h3>
              <p>{blurbs[id]}</p>
              <div className="foot">
                <span className="small">
                  {product.priceKey === "inDev" ? w.inDev : product.priceKey === "monthly" ? s.monthly : s.priceAsk}
                </span>
                <Link className="link" href={href}>
                  <span>{s.productPage}</span> →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <div className="sp-ctas">
        <a className="link" href={withLocale("/work/products", locale)}>
          {s.seeAllProducts} →
        </a>
      </div>
    </div>
  );
}
