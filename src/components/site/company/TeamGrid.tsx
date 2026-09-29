import Image from "next/image";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { TEAM, TEAM_GROUPS } from "@/lib/site/content";

type Props = { locale: Locale; s: SiteStrings["company"] };

// Company → Team panel — ported from site/index.html's `renderTeam()`.
export function TeamGrid({ locale, s }: Props) {
  const en = locale === "en";
  // v3's own "23명"/"23 people" is a literal count baked into the
  // dictionary at harvest time — computed from TEAM.length here instead so
  // it can't drift out of sync with the roster.
  const count = en ? `${TEAM.length} people` : `${TEAM.length}명`;

  return (
    <div className="panel wrap" style={{ paddingBlock: "var(--s3) var(--sec)" }}>
      <div className="row-between" style={{ marginBottom: "var(--s2)" }}>
        <p className="lead" style={{ fontSize: 16 }}>
          {s.teamLead}
        </p>
        <span className="cap" style={{ flex: "none" }}>
          {count}
        </span>
      </div>
      <div className="team-groups">
        {TEAM_GROUPS.map((group) => (
          <section className="team-group" key={group.id}>
            <h2 className="team-group-title">
              <span>{en ? group.label.en : group.label.ko}</span>
              <span className="cap tnum">{group.members.length}</span>
            </h2>
            <div className="team">
              {group.members.map((m) => (
                <article className={m.photo ? "member has-av" : "member"} key={m.name}>
                  {m.photo && (
                    <Image src={m.photo} alt={m.nameKo ? `${m.name} ${m.nameKo}` : m.name} width={64} height={64} />
                  )}
                  <span className="initial" aria-hidden="true">
                    {m.name[0]}
                  </span>
                  <h3>
                    {m.name}
                    {m.nameKo && <small lang="ko">{m.nameKo}</small>}
                  </h3>
                  <p>{en ? m.role.en : m.role.ko}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="cap" style={{ marginTop: "var(--s2)" }}>
        {s.teamNote}
      </p>
    </div>
  );
}
