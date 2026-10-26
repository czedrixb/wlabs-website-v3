import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { SegNav } from "@/components/site/work/SegNav";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// WOS-354: same `[panel]`-sibling arrangement as work/layout.tsx (its
// header explains why SegNav lives in the section layout rather than in
// [doc]/page.tsx — a layout persists across navigation between sibling
// panels, so the sliding pill stays mounted). Unlike Work/Company, there's
// no shared page-head here: v3's own legal screens have no eyebrow/h1 of
// their own either — each document's breadcrumb + `<h1>` is its title, not
// a shared "Legal" heading, so that lives in LegalDoc.tsx per-document
// instead. v3's screens also have no SegNav at all (footer-only, not
// reachable from any top-level tab); this two-item tab adds a way to move
// between Privacy and Terms beyond the in-document cross-link v3 has at the
// foot of each page.
export default async function LegalLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { chrome, legal } = siteT(locale);

  const items = [
    { key: "privacy", href: withLocale("/legal/privacy", locale), label: chrome.privacy },
    { key: "terms", href: withLocale("/legal/terms", locale), label: chrome.terms },
  ];

  return (
    <>
      <SegNav items={items} ariaLabel={legal.legalSeg} />
      {children}
    </>
  );
}
