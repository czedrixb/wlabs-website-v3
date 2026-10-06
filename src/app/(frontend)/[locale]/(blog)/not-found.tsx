import type { Locale } from "@/lib/locale";
import { pick } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { INSIGHT_CATEGORY_LABELS } from "@/lib/site/insightArticles";
import { getInsightEntries } from "@/lib/site/insightsIndex";
import {
  InsightNotFound,
  type InsightNotFoundPayload,
} from "@/components/site/insights/InsightNotFound";

// WOS-342: the (blog) group's 404 — reached when /insights/{slug} resolves
// neither a static article nor a post (v3's renderInsightMissing state,
// wlabs-01-wired.html:1877-1894). Next gives not-found.tsx no params, so
// both locales' resolved payloads go to a client child that reads the
// locale and the requested slug off the pathname (InsightNotFound.tsx).
// getInsightEntries() already degrades to the six static articles when the
// DB is unreachable, so the latest-3 rail still renders during an outage.
export default async function BlogGroupNotFound() {
  const entries = await getInsightEntries();
  const latest = entries.slice(0, 3);

  const payload = (locale: Locale): InsightNotFoundPayload => {
    const s = siteT(locale).insights;
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
        href: `/${locale}/insights/${e.slug}`,
        category: pick(
          locale,
          INSIGHT_CATEGORY_LABELS[e.categories[0]].ko,
          INSIGHT_CATEGORY_LABELS[e.categories[0]].en,
        ),
        dateLabel: pick(locale, e.dateLabel.ko, e.dateLabel.en),
        datetime: e.datetime,
        title: pick(locale, e.title.ko, e.title.en),
        dek: pick(locale, e.dek.ko, e.dek.en),
      })),
    };
  };

  return <InsightNotFound ko={payload("ko")} en={payload("en")} />;
}
