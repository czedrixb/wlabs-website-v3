import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { chrome } = siteT(locale);
  return siteMetadata({ locale, path: "/search", title: chrome.tabSearch });
}

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
