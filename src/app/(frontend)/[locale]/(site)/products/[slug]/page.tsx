import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

// Stub — WOS-314 Milestone 1 covers chrome + Home only; real product pages
// (SkinArch, BrainArch, WIZ) are a later step.
type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const { chrome } = siteT(resolveLocale(localeParam));

  return (
    <div className="wrap page-head">
      <span className="eyebrow">{chrome.segProducts}</span>
      <h1>{slug}</h1>
    </div>
  );
}
