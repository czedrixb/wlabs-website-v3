"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";

// Real content + markup shape from site/index.html's #home's sp-faq2
// instance (a plain accordion — "in the shell's plain list idiom, no
// canvas, nothing to learn", per the source's own comment). This
// supersedes an earlier pass at this component built against
// src/mods/mod-faq.html's canvas-textured design, which turns out to be
// stale: the design repo moved Home's FAQ to this simpler accordion and
// kept the canvas version (SpectrogramStack.tsx) only for the Contact
// page's larger 8-question set (#sp-bands-faq, not yet ported). Caught by
// visually checking the rendered page rather than by reading source alone
// — worth remembering for the rest of this port.
function buildFaqItems(s: SiteStrings["faq"]) {
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

type Props = { locale: Locale; s: SiteStrings["faq"] };

export function Faq({ locale, s }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqItems = buildFaqItems(s);

  return (
    <div className="wrap sp-home-faq">
      <section className="sp-faq2" aria-labelledby="sp-faq2-t-home">
        <div className="sp-faq2-top">
          <h2 className="eyebrow" id="sp-faq2-t-home">
            {s.title}
          </h2>
          <a className="link" href={withLocale("/contact", locale)}>
            {s.ask} →
          </a>
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
                  aria-controls={`sp-faq2-home-${i}`}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <b>{item.question}</b>
                  <span className="sp-faq2-mark" aria-hidden="true" />
                </button>
                <div className="sp-faq2-body" id={`sp-faq2-home-${i}`}>
                  <div className="sp-collapse-in">
                    <p>{item.answer}</p>
                    {item.note && <p className="cap">{item.note}</p>}
                    <div className="sp-faq2-ctas">
                      {item.ctas.map((cta) => (
                        <a key={cta.href} className="link" href={withLocale(cta.href, locale)}>
                          {cta.label} →
                        </a>
                      ))}
                    </div>
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
