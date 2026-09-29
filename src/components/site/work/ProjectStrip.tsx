import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { PROJECT_CATS, PROJECTS } from "@/lib/site/content";
import { ProjectGrid } from "./ProjectGrid";

type Props = { locale: Locale; s: SiteStrings["home"] };

// Home's `#home-projects` — ported from site/index.html's project-strip
// section, deferred out of WOS-314's Home pass because PROJECTS didn't
// exist as a typed constant yet. Shares ProjectGrid with /work/cases
// (this instance is capped at 4, matching v3's `data-limit="4"`).
export function ProjectStrip({ locale, s }: Props) {
  return (
    <div className="section wrap" style={{ paddingTop: 0 }} id="home-projects">
      <div className="section-head">
        <div>
          <span className="eyebrow">{s.projEyebrow}</span>
          <h2 style={{ marginTop: 12 }}>{s.projH2}</h2>
        </div>
        <p className="lead">{s.projLead}</p>
      </div>
      <ProjectGrid locale={locale} cats={PROJECT_CATS} projects={PROJECTS} filterLabel={s.filterLabel} limit={4} />
      <div className="sp-ctas">
        <a className="link" href={withLocale("/work/cases", locale)}>
          {s.seeAllProjects} →
        </a>
      </div>
    </div>
  );
}
