import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";
import { INSIGHTS, RAIL_ENTRIES } from "@/lib/site/content";
import { SegNav } from "@/components/site/work/SegNav";
import { TeamGrid } from "@/components/site/company/TeamGrid";
import { NewsList } from "@/components/site/company/NewsList";
import { StoryTimeline } from "@/components/site/company/StoryTimeline";
import { StoryRail, type ResolvedRailEntry } from "@/components/site/company/StoryRail";
import { CtaPanel } from "@/components/site/modules/CtaPanel";

type Props = { params: Promise<{ locale: string; panel: string }> };

const PANEL_KEYS = ["story", "team", "insights"] as const;
type PanelKey = (typeof PANEL_KEYS)[number];

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

  const segItems = [
    { key: "story", href: withLocale("/company/story", locale), label: chrome.story },
    { key: "team", href: withLocale("/company/team", locale), label: chrome.team },
    { key: "insights", href: withLocale("/company/insights", locale), label: chrome.insights },
  ];

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
  const newsItems = INSIGHTS.map((n) => ({
    id: n.id,
    date: n.date,
    kind: n.kind,
    link: n.link,
    heading: locale === "en" ? n.heading.en : n.heading.ko,
    body: locale === "en" ? n.body.en : n.body.ko,
  }));

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabCompany}</span>
        </div>
        <h1>{company.coH1}</h1>
        <p className="lead">{company.coLead2}</p>
      </div>
      <SegNav items={segItems} active={key} ariaLabel={chrome.coSeg} />

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
          <NewsList locale={locale} items={newsItems} s={s.insights} segProducts={chrome.segProducts} />
        </div>
      )}

      {key === "story" && (
        <div className="panel wrap is-rail-host" id="panel-story" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
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
            style={{ marginTop: "var(--s4)" }}
          />
        </div>
      )}
    </>
  );
}
