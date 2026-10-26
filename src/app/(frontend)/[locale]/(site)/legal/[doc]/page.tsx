import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { siteMetadata } from "@/lib/site/metadata";
import { LEGAL_DOCS, type LegalDocId } from "@/lib/site/content";
import { LegalDoc } from "@/components/site/legal/LegalDoc";

type Props = { params: Promise<{ locale: string; doc: string }> };

const DOC_KEYS = ["privacy", "terms"] as const;

export function generateStaticParams() {
  return DOC_KEYS.flatMap((doc) => [
    { locale: "ko", doc },
    { locale: "en", doc },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, doc } = await params;
  const locale = resolveLocale(localeParam);
  if (!DOC_KEYS.includes(doc as LegalDocId)) return {};
  const key = doc as LegalDocId;
  const legalDoc = LEGAL_DOCS[key];
  const title = locale === "en" ? legalDoc.title.en : legalDoc.title.ko;
  const lead = locale === "en" ? legalDoc.lead[0]!.en : legalDoc.lead[0]!.ko;
  return siteMetadata({ locale, path: `/legal/${key}`, title, description: lead });
}

// WOS-354: the footer's Privacy/Terms links — see Footer.tsx's own header
// comment for the finding (WOS-351 F11) that led here. Content itself is
// LEGAL_DOCS (src/lib/site/content.ts), ported from the v3 reference's
// `LEGAL` object plus the PIPA additions that file's header documents;
// presentation is LegalDoc.tsx, ported from v3's renderLegal(). Static like
// the rest of (site) — no revalidate, two documents, prerendered for both
// locales.
export default async function LegalDocPage({ params }: Props) {
  const { locale: localeParam, doc } = await params;
  const locale: Locale = resolveLocale(localeParam);
  if (!DOC_KEYS.includes(doc as LegalDocId)) notFound();
  const key = doc as LegalDocId;
  const siblingKey: LegalDocId = key === "privacy" ? "terms" : "privacy";

  const { chrome, legal } = siteT(locale);

  return (
    <LegalDoc
      locale={locale}
      doc={LEGAL_DOCS[key]}
      sibling={LEGAL_DOCS[siblingKey]}
      chrome={{ tabHome: chrome.tabHome, effective: legal.effective, switchCta: legal.switchCta }}
    />
  );
}
