import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

type Props = { params: Promise<{ locale: string }> };

// Stub — WOS-314 Milestone 1 covers chrome + Home only; real search is a
// later step.
export default async function SearchPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { chrome } = siteT(resolveLocale(localeParam));

  return (
    <div className="wrap page-head">
      <span className="eyebrow">{chrome.tabSearch}</span>
      <h1>{chrome.tabSearch}</h1>
    </div>
  );
}
