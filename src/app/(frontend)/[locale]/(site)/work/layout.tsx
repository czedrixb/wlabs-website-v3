import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { SegNav } from "@/components/site/work/SegNav";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// WOS-336: the page-head + segmented sub-nav live in the section LAYOUT,
// not in each [panel] page — a layout persists across navigation between
// sibling panels, so SegNav's sliding pill stays mounted and animates
// (v3's liquid to-left/to-right travel), instead of remounting in the
// `no-anim` state on every tab click. The head is identical across the
// three panels anyway; panel-specific content/metadata stays in the pages.
export default async function WorkLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { chrome, work } = siteT(locale);

  const items = [
    { key: "services", href: withLocale("/work/services", locale), label: chrome.segServices },
    { key: "products", href: withLocale("/work/products", locale), label: chrome.segProducts },
    { key: "cases", href: withLocale("/work/cases", locale), label: chrome.segCases },
  ];

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabWork}</span>
        </div>
        <h1>{work.workH1}</h1>
        <p className="lead">{work.workLead}</p>
      </div>
      <SegNav items={items} ariaLabel={chrome.workSeg} />
      {children}
    </>
  );
}
