import type { Locale } from "@/lib/locale";
import { pick } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { INSIGHT_CATEGORY_LABELS } from "@/lib/site/insightTaxonomy";
import { getInsightEntries, type InsightEntry } from "@/lib/site/insightsIndex";
import { insightPath } from "@/lib/site/insightPath";
import {
  InsightNotFound,
  type InsightNotFoundPayload,
} from "@/components/site/insights/InsightNotFound";

// WOS-342: the (blog) group's 404 — reached when /insights/{slug} resolves
// neither an AISEN post nor a CMS post (v3's renderInsightMissing state,
// wlabs-01-wired.html:1877-1894). Next gives not-found.tsx no params, so
// both locales' resolved payloads go to a client child that reads the
// locale and the requested slug off the pathname (InsightNotFound.tsx).
// getInsightEntries(locale) is per-locale since WOS-346 — two calls, both
// served from the same unstable_cache entries the listing already warmed —
// which also keeps the en 404 page's latest-3 rail from linking to
// untranslated (404) AISEN slugs. Both source fetches degrade to [] inside
// the index, so the rail still renders during an outage.
export default async function BlogGroupNotFound() {
  const [koEntries, enEntries] = await Promise.all([
    getInsightEntries("ko"),
    getInsightEntries("en"),
  ]);

  const payload = (locale: Locale, entries: InsightEntry[]): InsightNotFoundPayload => {
    const s = siteT(locale).insights;
    const latest = entries.slice(0, 3);
    return {
      crumbCompany: s.crumbCompany,
      crumbInsights: s.crumbInsights,
      nf404Title: s.nf404Title,
      nf404Dek: s.nf404Dek,
      nfRequested: s.nfRequested,
      nfAllInsights: s.nfAllInsights,
      nfBackHome: s.nfBackHome,
      latestInsights: s.latestInsights,
      cards: latest.map((e) => ({
        href: `/${locale}${insightPath(e.slug)}`,
        category: pick(
          locale,
          INSIGHT_CATEGORY_LABELS[e.categories[0]].ko,
          INSIGHT_CATEGORY_LABELS[e.categories[0]].en,
        ),
        dateLabel: e.dateLabel,
        datetime: e.datetime,
        title: e.title,
        dek: e.dek,
      })),
    };
  };

  return <InsightNotFound ko={payload("ko", koEntries)} en={payload("en", enEntries)} />;
}
