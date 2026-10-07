import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { resolveLocale, pick } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";
import { RAIL_ENTRIES } from "@/lib/site/content";
import { getInsightEntries } from "@/lib/site/insightsIndex";
import { TeamGrid } from "@/components/site/company/TeamGrid";
import { InsightsList, type InsightListItem } from "@/components/site/company/InsightsList";
import { StoryTimeline } from "@/components/site/company/StoryTimeline";
import { StoryRail, type ResolvedRailEntry } from "@/components/site/company/StoryRail";
import { CtaPanel } from "@/components/site/modules/CtaPanel";

type Props = { params: Promise<{ locale: string; panel: string }> };

const PANEL_KEYS = ["story", "team", "insights"] as const;
type PanelKey = (typeof PANEL_KEYS)[number];

// Matches src/lib/cachedPosts.ts's own unstable_cache TTL — the insights
// panel's posts can be up to 60s stale, same as the old /blog listing was.
// Not force-dynamic: generateStaticParams below prerenders all three
// panels, and story/team are pure static content that shouldn't lose that.
export const revalidate = 60;

export function generateStaticParams() {
  return PANEL_KEYS.flatMap((panel) => [
    { locale: "ko", panel },
    { locale: "en", panel },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, panel } = await params;
  const locale = resolveLocale(localeParam);
  if (!PANEL_KEYS.includes(panel as PanelKey)) return {};
  const { company } = siteT(locale);
  return siteMetadata({ locale, path: `/company/${panel}`, title: company.coH1, description: company.coLead2 });
}

// Company's three segmented panels. `story` opens with the interactive
// sp-rail "reading log" (WOS-336 — the piece WOS-332's plan deferred),
// followed by the prose intro, the 5-entry timeline, values and the
// partnership CTA — the same coexistence v3's #panel-story has
// (index.html:2525-2640). `team`/`insights` are fully ported.
export default async function CompanyPanelPage({ params }: Props) {
  const { locale: localeParam, panel } = await params;
  const locale: Locale = resolveLocale(localeParam);
  if (!PANEL_KEYS.includes(panel as PanelKey)) notFound();
  const key = panel as PanelKey;

  const s = siteT(locale);
  const { chrome, company } = s;

  const timelineItems = [
    { year: "2022", heading: company.tl1h, body: company.tl1p },
    { year: "2023", heading: company.tl2h, body: company.tl2p },
    { year: "2024", heading: company.tl3h, body: company.tl3p },
    { year: "2025", heading: company.tl4h, body: company.tl4p },
    { year: "2026", heading: company.tl5h, body: company.tl5p },
  ];
  const values = [
    { h: company.v1h, p: company.v1p },
    { h: company.v2h, p: company.v2p },
    { h: company.v3h, p: company.v3p },
    { h: company.v4h, p: company.v4p },
  ];
  const railEntries: ResolvedRailEntry[] = RAIL_ENTRIES.map((e) => ({
    id: e.id,
    type: e.type,
    t: e.t,
    ...(e.total !== undefined ? { total: e.total } : {}),
    datetime: e.datetime,
    dateLabel: e.dateLabel,
    circa: e.circa,
    title: locale === "en" ? e.title.en : e.title.ko,
    ...(e.meta ? { meta: locale === "en" ? e.meta.en : e.meta.ko } : {}),
    para: locale === "en" ? e.para.en : e.para.ko,
    ...(e.enote ? { enote: locale === "en" ? e.enote.en : e.enote.ko, enoteRuo: e.enoteRuo } : {}),
    ...(e.breakLine ? { breakLine: e.breakLine } : {}),
    ...(e.link ? { link: e.link } : {}),
  }));
  // WOS-342: one newest-first union of the six static v3 articles and the
  // CMS posts (insightsIndex.ts resolves the interleave, the untagged→notes
  // default and the DB-outage fallback to statics) — resolved to plain
  // strings here, same client-boundary convention as timelineItems above.
  let insightItems: InsightListItem[] = [];
  if (key === "insights") {
    const entries = await getInsightEntries();
    insightItems = entries.map((e) => ({
      slug: e.slug,
      dateLabel: pick(locale, e.dateLabel.ko, e.dateLabel.en),
      datetime: e.datetime,
      categories: e.categories,
      title: pick(locale, e.title.ko, e.title.en),
      excerpt: pick(locale, e.excerpt.ko, e.excerpt.en),
      ...(e.shot ? { shot: e.shot } : {}),
    }));
  }

  return (
    <>
      {key === "team" && <TeamGrid locale={locale} s={company} />}

      {key === "insights" && (
        <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
          <div className="section-head" style={{ marginBottom: "var(--s3)" }}>
            <div>
              <span className="eyebrow">{chrome.insights}</span>
              <h2 style={{ marginTop: 12, fontSize: "var(--fs-h2)" }}>{s.insights.insH2}</h2>
            </div>
            <p className="lead" style={{ fontSize: 16 }}>
              {s.insights.insLead}
            </p>
          </div>
          <InsightsList locale={locale} items={insightItems} s={s.insights} />
        </div>
      )}

      {/* WOS-336: story gets no top padding — the rail band follows the
          sticky tab bar directly (the bar's own 10px padding is the gap,
          v3 :1599); the other two panels keep their --s3. */}
      {key === "story" && (
        <div className="panel wrap is-rail-host" id="panel-story" style={{ paddingBlock: "0 var(--sec)" }}>
          <StoryRail s={s.rail} entries={railEntries} />
          <div className="story-intro">
            <div>
              <span className="eyebrow">{company.storyEyebrow}</span>
              <h2 style={{ marginTop: 12, fontSize: "var(--fs-h2)" }}>{company.storyH2}</h2>
            </div>
            <p className="lead">{company.storyLead}</p>
          </div>
          <StoryTimeline items={timelineItems} />
          <div className="values">
            {values.map((v, i) => (
              <article key={i}>
                <span className="pcat">0{i + 1}</span>
                <h3>{v.h}</h3>
                <p>{v.p}</p>
              </article>
            ))}
          </div>
          <CtaPanel
            locale={locale}
            eyebrow={chrome.partner}
            h2={company.partnerH2}
            h2FontSize={24}
            primary={{ label: company.partnerCta, topic: "partnership" }}
          />
        </div>
      )}
    </>
  );
}
