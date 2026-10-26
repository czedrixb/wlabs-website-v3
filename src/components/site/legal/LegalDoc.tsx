import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { LegalDoc as LegalDocData } from "@/lib/site/content";

type Chrome = { tabHome: string; effective: string; switchCta: string };

type Props = {
  locale: Locale;
  doc: LegalDocData;
  sibling: LegalDocData;
  chrome: Chrome;
};

// Ported from v3's renderLegal() (site/index.html:4088-4103): breadcrumb →
// h1 → the effective date (v3 promises one in §9 but never actually renders
// it — WOS-354 closes that gap) → lead paragraphs → sections → a cross-link
// to the sibling document. Unlike v3's single-file `bi()`/`.alt` trick
// (which emits both languages into the DOM and hides one with CSS, because
// that build has no server), this resolves locale once here — the same
// `locale === "en" ? x.en : x.ko` convention as TeamGrid/ProductCard.
//
// v3 carries a "Korean text prevails" courtesy-translation notice here;
// dropped for this port (per request) rather than ported or replaced.
//
// Section numbers are derived from the array position, not carried on the
// data (content.ts strips v3's baked-in numerals) — see that file's header
// for why: it lets the two PIPA additions slot in without renumbering the
// ported headings by hand.
export function LegalDoc({ locale, doc, sibling, chrome }: Props) {
  const en = locale === "en";
  const t = (b: { ko: string; en: string }) => (en ? b.en : b.ko);
  const siblingHref = withLocale(`/legal/${sibling.id}`, locale);

  return (
    <div className="wrap legal-doc">
      <nav className="crumbs" aria-label="breadcrumb">
        <Link href={withLocale("/", locale)}>{chrome.tabHome}</Link>
        <span>/</span>
        <b>{t(doc.title)}</b>
      </nav>
      <h1>{t(doc.title)}</h1>
      <p>
        <strong>{chrome.effective}:</strong> {doc.effective}
      </p>
      {doc.lead.map((p, i) => (
        <p key={i}>{t(p)}</p>
      ))}
      {doc.sections.map((section, i) => (
        <section key={i}>
          <h2>
            {i + 1}. {t(section.heading)}
          </h2>
          {section.blocks.map((block, j) => {
            if (block.kind === "h3") return <h3 key={j}>{t(block.text)}</h3>;
            if (block.kind === "p") return <p key={j}>{t(block.text)}</p>;
            return (
              <ul key={j}>
                {block.items.map((item, k) => (
                  <li key={k}>{t(item)}</li>
                ))}
              </ul>
            );
          })}
        </section>
      ))}
      <nav className="legal-switch">
        <Link className="link" href={siblingHref}>
          {chrome.switchCta.replace("{doc}", t(sibling.title))}
        </Link>
      </nav>
    </div>
  );
}
