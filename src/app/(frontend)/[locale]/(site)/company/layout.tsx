import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { SegNav } from "@/components/site/work/SegNav";
import { CompanyScreen } from "@/components/site/company/CompanyScreen";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// WOS-336: same arrangement as work/layout.tsx — see its header — except
// the Company tabs sit in v3's own `.sp-rail-tabs > .sp-rail-navrow` bar
// (index.html wireCompanyRail(), :5414-5420): a bare sticky row on the
// page's cream, pinned for the whole screen, that the story reading-rail
// band then pins UNDER (site.css `#company …` layer). CompanyScreen
// supplies the `#company` scope + `is-story` state those rules key on.
export default async function CompanyLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { chrome, company } = siteT(locale);

  const items = [
    { key: "story", href: withLocale("/company/story", locale), label: chrome.story },
    { key: "team", href: withLocale("/company/team", locale), label: chrome.team },
    { key: "insights", href: withLocale("/company/insights", locale), label: chrome.insights },
  ];

  return (
    <CompanyScreen>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabCompany}</span>
        </div>
        <h1>{company.coH1}</h1>
        <p className="lead">{company.coLead2}</p>
      </div>
      <div className="sp-rail-tabs">
        <div className="sp-rail-navrow">
          <SegNav items={items} ariaLabel={chrome.coSeg} />
        </div>
      </div>
      {children}
    </CompanyScreen>
  );
}
