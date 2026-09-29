import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { Hero } from "@/components/site/home/Hero";
import { ProofBand } from "@/components/site/home/ProofBand";
import { Field } from "@/components/site/modules/Field";
import { Band } from "@/components/site/modules/Band";
import { Faq } from "@/components/site/modules/Faq";

type Props = { params: Promise<{ locale: string }> };

// WOS-314 Milestone 1: Hero, mod-field (the dark proof band) and mod-band
// (services) are real; Work/Company/Contact stay stubs until later steps.
// Also deferred, both for the same reason — they need content that doesn't
// exist yet (Step 6): the project strip and the six-face company teaser
// that sit between Band and Faq in site/index.html.
export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const s = siteT(locale);

  return (
    <>
      <Hero locale={locale} s={s.home} />
      <Field dark>
        <ProofBand s={s.proof} />
      </Field>
      <Band locale={locale} s={s.band} />
      <Faq locale={locale} s={s.faq} />
    </>
  );
}
