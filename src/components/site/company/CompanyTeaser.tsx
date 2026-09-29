import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { TEAM } from "@/lib/site/content";

type Props = { locale: Locale; s: SiteStrings["home"] };

const TEASER_COUNT = 6;

// Home's six-face company teaser, ported from site/index.html's
// `.company-teaser` block — deferred out of WOS-314's Home pass for the
// same reason as ProjectStrip: TEAM didn't exist as a typed constant yet.
// `renderTeam()`'s `teaser-avatars` strip: the first 6 members' photos (or
// `.initial` monograms for the 4 with none), then a "+N" chip for the rest.
export function CompanyTeaser({ locale, s }: Props) {
  const shown = TEAM.slice(0, TEASER_COUNT);
  const rest = TEAM.length - TEASER_COUNT;

  return (
    <div className="section wrap company-teaser" style={{ paddingTop: 0 }}>
      <div>
        <span className="eyebrow">{s.coEyebrow}</span>
        <h2 style={{ marginTop: 12, fontSize: "var(--fs-h2)" }}>{s.coH2}</h2>
      </div>
      <div className="stack">
        <p className="lead">{s.coLead}</p>
        <div className="row-between">
          <div className="avatars" aria-label="W Labs team">
            {shown.map((m) =>
              m.photo ? (
                <img key={m.name} src={m.photo} alt={m.name} width={40} height={40} />
              ) : (
                <span key={m.name} className="initial" aria-hidden="true">
                  {m.name[0]}
                </span>
              ),
            )}
            {rest > 0 && <span>+{rest}</span>}
          </div>
          <span className="sp-ctas" style={{ marginTop: 0 }}>
            <a className="link" href={withLocale("/company/team", locale)}>
              {s.aboutLink} →
            </a>
            <a className="link" href={withLocale("/company/story", locale)}>
              {s.ctaHistory} →
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
