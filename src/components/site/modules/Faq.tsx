"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";

// Real content + markup shape from site/index.html's sp-faq2 instances (a
// plain accordion — "in the shell's plain list idiom, no canvas, nothing
// to learn", per the source's own comment). This supersedes an earlier
// pass at this component built against src/mods/mod-faq.html's
// canvas-textured design, which the design repo has since dropped:
// today's built reference uses this accordion for BOTH FAQ surfaces —
// Home's 4-question set (#sp-faq2-t-home) and Contact's 8-question
// inquiry set (#sp-faq2-t-inq, index.html:3012-3095; no CTAs, no "ask"
// link, only Q3 keeps its regulatory cap note) — and #sp-bands-faq no
// longer exists there. The `variant` prop selects which instance this is.
type FaqItem = { id: string; question: string; answer: string; note?: string; ctas?: { href: string; label: string }[] };

function buildHomeItems(s: SiteStrings["faq"]): FaqItem[] {
  return [
    {
      id: "what",
      question: s.q1,
      answer: s.a1,
      ctas: [
        { href: "/work/services", label: s.ctaSeeAll },
        { href: "/work/cases", label: s.ctaProjects },
      ],
    },
    {
      id: "start",
      question: s.q2,
      answer: s.a2,
      ctas: [{ href: "/contact", label: s.ctaFind }],
    },
    {
      id: "medical",
      question: s.q3,
      answer: s.a3,
      note: s.note3,
      ctas: [{ href: "/work/products", label: s.ctaProducts }],
    },
    {
      id: "vetted",
      question: s.q4,
      answer: s.a4,
      ctas: [{ href: "/company/story", label: s.ctaHistory }],
    },
  ];
}

function buildInquiryItems(s: SiteStrings["faq"]): FaqItem[] {
  return [
    { id: "what", question: s.q1, answer: s.a1 },
    { id: "start", question: s.q2, answer: s.a2 },
    { id: "medical", question: s.q3, answer: s.a3, note: s.note3 },
    { id: "vetted", question: s.q4, answer: s.a4 },
    { id: "bilingual", question: s.q5, answer: s.a5 },
    { id: "after", question: s.q6, answer: s.a6 },
    { id: "existing", question: s.q7, answer: s.a7 },
    { id: "size", question: s.q8, answer: s.a8 },
  ];
}

type Props = { locale: Locale; s: SiteStrings["faq"]; variant?: "home" | "inquiry" };

export function Faq({ locale, s, variant = "home" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const inquiry = variant === "inquiry";
  const faqItems = inquiry ? buildInquiryItems(s) : buildHomeItems(s);
  const idBase = inquiry ? "sp-faq2-inq" : "sp-faq2-home";

  return (
    <div className="wrap sp-home-faq">
      <section className="sp-faq2" aria-labelledby={`sp-faq2-t-${inquiry ? "inq" : "home"}`}>
        <div className="sp-faq2-top">
          <h2 className="eyebrow" id={`sp-faq2-t-${inquiry ? "inq" : "home"}`}>
            {s.title}
          </h2>
          {/* Only Home carries the "ask us directly" link — the inquiry
              instance already sits on the contact page (v3 :3016-3018). */}
          {!inquiry && (
            <a className="link" href={withLocale("/contact", locale)}>
              {s.ask} →
            </a>
          )}
        </div>
        <div className="sp-faq2-list">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.id} className={isOpen ? "sp-faq2-item is-open" : "sp-faq2-item"}>
                <button
                  className="sp-faq2-q"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${idBase}-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <b>{item.question}</b>
                  <span className="sp-faq2-mark" aria-hidden="true" />
                </button>
                <div className="sp-faq2-body" id={`${idBase}-${i}`}>
                  <div className="sp-collapse-in">
                    <p>{item.answer}</p>
                    {item.note && <p className="cap">{item.note}</p>}
                    {item.ctas && (
                      <div className="sp-faq2-ctas">
                        {item.ctas.map((cta) => (
                          <a key={cta.href} className="link" href={withLocale(cta.href, locale)}>
                            {cta.label} →
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
