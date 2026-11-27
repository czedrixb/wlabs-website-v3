import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { Product, ProductId } from "@/lib/site/content";

type Props = { locale: Locale; product: Product; s: SiteStrings["work"] };

// The card capture for a product. Willy's page hero is a desktop render;
// its cards use the film's end card instead (willy-card.webp), as v3 does
// with `data-shot-key="willy-card"` (WOS-383).
export function productShot(id: ProductId): React.CSSProperties {
  const file = id === "willy" ? "willy-card" : id;
  return { "--shot": `url(/site/img/${file}.webp)` } as React.CSSProperties;
}

// Work → Products panel's card — the short teaser, not the full detail
// page (products/[slug], WOS-332 plan's M4). Ported from site/index.html's
// `#panel-products` `.card`s.
export function ProductCard({ locale, product, s }: Props) {
  const blurb = { skinarch: s.pp1, wiz: s.pp2, brainarch: s.pp3, familytree: s.pp4, willy: s.pp5 }[product.id];
  const price = product.priceKey === "inDev" ? s.inDev : product.priceKey === "monthly" ? s.monthly : s.priceAsk;

  return (
    <article className="card">
      {/* WOS-336: the product capture, above the tag row — v3 has no art
          slot in this card's own markup either; its `shots()` wiring
          injects one as firstChild with exactly these classes
          (`.sp-shot-made` states the shape a created slot gets). */}
      <div
        className="art sp-shot sp-shot-made"
        aria-hidden="true"
        style={productShot(product.id)}
      />
      <div className="tag">
        <span>{locale === "en" ? product.cat.en : product.cat.ko}</span>
        {product.ruo && <span className="ruo">{locale === "en" ? "Research use only" : "연구용"}</span>}
        {product.dev && <span className="ruo">{s.inDev}</span>}
      </div>
      <h3>
        <Link href={withLocale(`/products/${product.id}`, locale)}>{product.name}</Link>
      </h3>
      <p>{blurb}</p>
      <div className="chips">
        {/* data-tip + tabIndex opt each chip into the shared glossary
            tooltip (TipboxHost, WOS-336) — chip text IS the CHIP_TIPS term. */}
        {product.teaserChips.map((chip) => (
          <span className="chip" data-tip={chip} tabIndex={0} key={chip}>
            {chip}
          </span>
        ))}
      </div>
      <div className="foot">
        <span className="small">{price}</span>
        <Link className="link" href={withLocale(`/products/${product.id}`, locale)}>
          <span>{s.productPage}</span> →
        </Link>
      </div>
    </article>
  );
}
