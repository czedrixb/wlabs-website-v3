import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { PROJECT_CATS, PROJECTS, PRODUCT_ORDER, PRODUCTS } from "@/lib/site/content";
import { SegNav } from "@/components/site/work/SegNav";
import { ServiceDetail } from "@/components/site/work/ServiceDetail";
import { ProductCard } from "@/components/site/work/ProductCard";
import { ProjectGrid } from "@/components/site/work/ProjectGrid";

type Props = { params: Promise<{ locale: string; panel: string }> };

const PANEL_KEYS = ["services", "products", "cases"] as const;
type PanelKey = (typeof PANEL_KEYS)[number];

function segItems(locale: Locale, chrome: ReturnType<typeof siteT>["chrome"]) {
  return [
    { key: "services", href: withLocale("/work/services", locale), label: chrome.segServices },
    { key: "products", href: withLocale("/work/products", locale), label: chrome.segProducts },
    { key: "cases", href: withLocale("/work/cases", locale), label: chrome.segCases },
  ];
}

export function generateStaticParams() {
  return PANEL_KEYS.flatMap((panel) => [
    { locale: "ko", panel },
    { locale: "en", panel },
  ]);
}

// Work's three segmented panels — services (ServiceDetail), products
// (ProductCard grid) and cases (the shared ProjectGrid, unlimited). Each
// panel is its own route rather than a client-side tab switch (see
// SegNav's header for why), replacing the WOS-314 stub.
export default async function WorkPanelPage({ params }: Props) {
  const { locale: localeParam, panel } = await params;
  const locale = resolveLocale(localeParam);
  if (!PANEL_KEYS.includes(panel as PanelKey)) notFound();
  const key = panel as PanelKey;

  const s = siteT(locale);
  const { chrome, work, home } = s;

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabWork}</span>
        </div>
        <h1>{work.workH1}</h1>
        <p className="lead">{work.workLead}</p>
      </div>
      <SegNav items={segItems(locale, chrome)} active={key} ariaLabel={chrome.workSeg} />

      {key === "services" && <ServiceDetail locale={locale} d={work} ctaDiscuss={chrome.ctaDiscuss} />}

      {key === "products" && (
        <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
          <div className="cards">
            {PRODUCT_ORDER.map((id) => (
              <ProductCard key={id} locale={locale} product={PRODUCTS[id]} s={work} />
            ))}
          </div>
          <p className="note" style={{ marginTop: "var(--s3)" }}>
            {work.ruoNote}
          </p>
        </div>
      )}

      {key === "cases" && (
        <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
          <ProjectGrid locale={locale} cats={PROJECT_CATS} projects={PROJECTS} filterLabel={home.filterLabel} showStatus />
          <p className="cap" style={{ marginTop: "var(--s2)" }}>
            {work.projNote}
          </p>
        </div>
      )}
    </>
  );
}
