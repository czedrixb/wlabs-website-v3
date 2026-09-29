import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import { SERVICES } from "@/lib/site/content";
import { SpectrogramStack, type StackItem } from "./SpectrogramStack";

// Structural metadata (number/weight/anchor) now lives in content.ts's
// SERVICES (WOS-332), shared with the Work services panel and the
// product/project "Related" rails instead of living here alone. Copy still
// comes from the dictionary — v3's own SVC1-5/spTunerSvcNm1-5 keys are used
// for both the accordion teaser and the expanded answer (see
// dictionary.generated.ts), matching this component's original (duplicated)
// SERVICE_COPY rather than harvesting two separate strings for the same
// sentence.
function buildServiceCopy(s: SiteStrings["band"]) {
  const questions = [s.svcName1, s.svcName2, s.svcName3, s.svcName4, s.svcName5];
  const bodies = [s.svc1, s.svc2, s.svc3, s.svc4, s.svc5];
  return SERVICES.map((svc, i) => ({
    key: svc.id,
    number: svc.number,
    weight: svc.weight,
    question: questions[i],
    body: bodies[i],
  }));
}

type Props = { locale: Locale; s: SiteStrings["band"] };

// Home's #home-services section — a .section-head (shared with every other
// Home section) wrapping the five-service band stack. Ported from
// site/index.html's #home-services block; the band engine itself lives in
// SpectrogramStack.tsx.
export function Band({ locale, s }: Props) {
  const items: StackItem[] = buildServiceCopy(s).map((svc) => ({
    key: svc.key,
    weight: svc.weight,
    number: svc.number,
    question: svc.question,
    questionText: svc.question,
    teaser: svc.body,
    teaserText: svc.body,
    answer: <p>{svc.body}</p>,
    answerText: svc.body,
    ctas: [
      { href: withLocale("/work/services", locale), label: s.ctaOpen },
      { href: withLocale("/contact", locale), label: s.ctaFind, ghost: true },
    ],
  }));

  return (
    <div className="section wrap" id="home-services">
      <div className="section-head">
        <div>
          <span className="eyebrow">{s.eyebrow}</span>
          <h2 style={{ marginTop: 12 }}>{s.heading}</h2>
        </div>
        <p className="lead">{s.lead}</p>
      </div>
      <section className="sp-bands" aria-labelledby="sp-bands-svc-title">
        <h3 className="sp-bands-sr" id="sp-bands-svc-title">
          {s.eyebrow}
        </h3>
        <SpectrogramStack items={items} />
      </section>
      <div className="sp-ctas">
        <a className="link" href={withLocale("/work/services", locale)}>
          {s.ctaSeeAll} →
        </a>
      </div>
    </div>
  );
}
