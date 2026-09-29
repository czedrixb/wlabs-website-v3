import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

type Props = { params: Promise<{ locale: string; panel: string }> };

// Stub — WOS-314 Milestone 1 covers chrome + Home only; Work's real
// segmented content is a later step. The panel label reuses the same
// dictionary entry as the nav item that links here (chrome.segServices/
// segProducts/segCases) rather than a separate stub-only string.
export default async function WorkPanelPage({ params }: Props) {
  const { locale: localeParam, panel } = await params;
  const locale = resolveLocale(localeParam);
  const { chrome } = siteT(locale);

  const PANELS: Record<string, string> = {
    services: chrome.segServices,
    products: chrome.segProducts,
    cases: chrome.segCases,
  };
  const label = PANELS[panel];
  if (!label) notFound();

  return (
    <div className="wrap page-head">
      <span className="eyebrow">{chrome.tabWork}</span>
      <h1>{label}</h1>
    </div>
  );
}
