import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";

type Props = { params: Promise<{ locale: string }> };

// Stub — WOS-314 Milestone 1 covers chrome + Home only; the real inquiry
// form (mod-tuner + backend, Step 8) is a later step.
export default async function ContactPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { chrome } = siteT(resolveLocale(localeParam));

  return (
    <div className="wrap page-head">
      <span className="eyebrow">{chrome.tabContact}</span>
      <h1>{chrome.tabContact}</h1>
    </div>
  );
}
