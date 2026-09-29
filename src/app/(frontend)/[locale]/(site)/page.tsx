import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { Hero } from "@/components/site/home/Hero";
import { ProofBand } from "@/components/site/home/ProofBand";
import { Field } from "@/components/site/modules/Field";
import { Band } from "@/components/site/modules/Band";
import { Faq } from "@/components/site/modules/Faq";
import { ProjectStrip } from "@/components/site/work/ProjectStrip";
import { CompanyTeaser } from "@/components/site/company/CompanyTeaser";
import { buildSnippetPool } from "@/lib/site/snippetPool";

type Props = { params: Promise<{ locale: string }> };

// WOS-314 Milestone 1 shipped Hero, mod-field (the dark proof band) and
// mod-band (services); the project strip and six-face company teaser that
// sit between Band and Faq in site/index.html, and the hero's node-tips
// snippets, were deferred because PROJECTS/TEAM didn't exist as typed
// constants yet. WOS-332 supplies those constants and all three pieces
// below. Work/Company/Contact themselves are ported separately (see their
// own route files).
export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const s = siteT(locale);
  const snippetPool = buildSnippetPool(locale);

  return (
    <>
      <Hero locale={locale} s={s.home} pool={snippetPool} />
      <Field dark>
        <ProofBand s={s.proof} />
      </Field>
      <Band locale={locale} s={s.band} />
      <ProjectStrip locale={locale} s={s.home} />
      <CompanyTeaser locale={locale} s={s.home} />
      <Faq locale={locale} s={s.faq} />
    </>
  );
}
