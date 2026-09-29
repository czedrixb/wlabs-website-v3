import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";
import { Hero } from "@/components/site/home/Hero";
import { ProofBand } from "@/components/site/home/ProofBand";
import { ProductsPreview } from "@/components/site/home/ProductsPreview";
import { Field } from "@/components/site/modules/Field";
import { Band } from "@/components/site/modules/Band";
import { Faq } from "@/components/site/modules/Faq";
import { CtaPanel } from "@/components/site/modules/CtaPanel";
import { ProjectStrip } from "@/components/site/work/ProjectStrip";
import { CompanyTeaser } from "@/components/site/company/CompanyTeaser";
import { buildSnippetPool } from "@/lib/site/snippetPool";

type Props = { params: Promise<{ locale: string }> };

// No title/description override — (site)/layout.tsx's own generateMetadata
// already covers Home, this only adds the canonical/hreflang alternates.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  return siteMetadata({ locale: resolveLocale(localeParam), path: "/" });
}

// WOS-314 Milestone 1 shipped Hero, mod-field (the dark proof band) and
// mod-band (services); WOS-332 added the project strip and company teaser;
// WOS-336 completes v3's section order (index.html:2314/2424) with the
// products 3-card preview after Band and the closing "다음 단계" CTA panel
// after the FAQ. Work/Company/Contact themselves are ported separately
// (see their own route files).
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
      <ProductsPreview locale={locale} s={s.home} />
      <ProjectStrip locale={locale} s={s.home} />
      <CompanyTeaser locale={locale} s={s.home} />
      <Faq locale={locale} s={s.faq} />
      <div className="wrap" style={{ paddingBottom: "var(--sec)" }}>
        <CtaPanel
          locale={locale}
          eyebrow={s.home.ctaEyebrow}
          h2={s.home.ctaH2}
          primary={{ label: s.home.ctaDiscuss, topic: "general" }}
          ghost={{ label: s.home.ctaNews, topic: "newsletter" }}
        />
      </div>
    </>
  );
}
