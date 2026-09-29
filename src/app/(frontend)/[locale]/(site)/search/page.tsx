import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";
import { buildSearchIndex } from "@/lib/site/searchIndex";
import { SearchClient } from "@/components/site/search/SearchClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { chrome, search } = siteT(locale);
  return siteMetadata({ locale, path: "/search", title: chrome.tabSearch, description: search.searchH1 });
}

// WOS-336: replaces the WOS-314 stub with v3's real search screen
// (site/index.html:2671-2690 markup, :3652-3686 behavior). The index is
// static site content, so it's built here on the server and handed to the
// client component as a plain prop; SearchClient owns the debounced
// scoring, keyboard navigation, result states and the rotating shortcut
// list.
export default async function SearchPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const s = siteT(locale);

  return <SearchClient locale={locale} eyebrow={s.chrome.tabSearch} s={s.search} index={buildSearchIndex()} />;
}
