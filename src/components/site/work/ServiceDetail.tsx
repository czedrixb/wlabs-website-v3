import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { PROJECTS, PRODUCTS, SERVICES, type ServiceRelatedRef } from "@/lib/site/content";

type Props = { locale: Locale; d: SiteStrings["work"]; ctaDiscuss: string };

function relatedLabel(locale: Locale, ref: ServiceRelatedRef): string {
  if (ref.kind === "project") return locale === "en" ? PROJECTS.find((p) => p.id === ref.id)!.title.en : PROJECTS.find((p) => p.id === ref.id)!.title.ko;
  if (ref.kind === "product") return PRODUCTS[ref.id].name;
  return locale === "en" ? ref.label.en : ref.label.ko;
}

function relatedHref(locale: Locale, ref: ServiceRelatedRef): string | null {
  if (ref.kind === "project") return withLocale(`/projects/${ref.id}`, locale);
  if (ref.kind === "product") return withLocale(`/products/${ref.id}`, locale);
  return null;
}

// Work → Services panel: 5 `<article class="svc-detail">`s, one per
// SERVICES entry, each anchored at its own #svc-* id so the product/
// project detail pages' "Related" rail can link straight back. `d1`-`d5`
// are the one dictionary field per service this panel needs beyond what
// SERVICES/Band.tsx's copy already carries; chips and the related rail's
// entries are SERVICES' own data (see content.ts's header on why those are
// hand-authored there rather than harvested).
export function ServiceDetail({ locale, d, ctaDiscuss }: Props) {
  const bodies = [d.d1, d.d2, d.d3, d.d4, d.d5];
  return (
    <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
      {SERVICES.map((svc, i) => (
        <article className="svc-detail" id={svc.anchor} key={svc.id}>
          <span className="num">
            <b>{svc.number}</b> / {svc.code}
          </span>
          <h2>{locale === "en" ? svc.name.en : svc.name.ko}</h2>
          <p>{bodies[i]}</p>
          <div className="chips">
            {/* data-tip + tabIndex opt each chip into the shared glossary
                tooltip (TipboxHost) — chip text IS the CHIP_TIPS term here,
                same as v3's runtime text-matching (WOS-336). */}
            {svc.chips.map((chip) => (
              <span className="chip" data-tip={chip} tabIndex={0} key={chip}>
                {chip}
              </span>
            ))}
          </div>
          <div className="related">
            <span className="cap">{svc.relatedCaption === "relatedProducts" ? d.relatedProducts : d.relatedLabel}</span>
            <div className="rel-list">
              {svc.related.map((ref) => {
                const href = relatedHref(locale, ref);
                const label = relatedLabel(locale, ref);
                const inner = (
                  <>
                    <span className="initial" aria-hidden="true">
                      {ref.abbr}
                    </span>
                    <span>{label}</span>
                  </>
                );
                return href ? (
                  <Link className="rel-item" href={href} key={ref.abbr + label}>
                    {inner}
                  </Link>
                ) : (
                  <span className="rel-item is-static" key={ref.abbr + label}>
                    {inner}
                  </span>
                );
              })}
            </div>
            {svc.id === "evolution" && <span className="small">{d.relatedOpsNote}</span>}
          </div>
          <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={svc.topic}>
            <span>{ctaDiscuss}</span>
            <span className="arr" aria-hidden="true">
              ↗
            </span>
          </Link>
        </article>
      ))}
    </div>
  );
}
