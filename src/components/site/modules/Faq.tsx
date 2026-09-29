"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";

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
//
// Korean only for now, matching every other site-chrome piece so far — the
// EN dictionary is Step 5.
const FAQ_ITEMS = [
  {
    question: "W Labs는 어떤 일을 하나요?",
    answer:
      "서울에 있는 AI-first 소프트웨어 개발 회사입니다. 협업 방식은 다섯 가지입니다 — AI·지능형 자동화, 맞춤 소프트웨어 개발, 데이터·이미징 인텔리전스, UI/UX·제품 디자인, 현대화·지원. 2022년부터 중단 없이 고객사 프로젝트를 수행해 왔습니다.",
    ctas: [
      { href: "/work/services", label: "다섯 가지 방식 보기" },
      { href: "/work/cases", label: "프로젝트 보기" },
    ],
  },
  {
    question: "프로젝트는 어떻게 시작하나요?",
    answer:
      "도메인은 매번 달랐지만 접근은 같았습니다. 기술을 고르기 전에 문제를 함께 정의합니다. 무엇이 필요한지 먼저 확인하고, 그다음에 범위와 일정을 이야기합니다.",
    ctas: [{ href: "/contact", label: "필요한 것부터 찾아보기" }],
  },
  {
    question: "SkinArch와 BrainArch는 의료기기인가요?",
    answer:
      "아닙니다. SkinArch와 BrainArch는 모두 연구용(Research Use Only) 소프트웨어입니다. 의료기기가 아니며 진단 목적이 아닙니다. 연구자를 돕는 도구이며 임상 판단을 대신하지 않습니다.",
    note: "공개된 성능 수치는 없습니다. 결과는 연구 협약 하에 공유합니다. 가격은 문의해 주세요.",
    ctas: [{ href: "/work/products", label: "제품 보기" }],
  },
  {
    question: "어떤 검증을 거쳤나요?",
    answer:
      "2025년에 D-U-N-S 등록과 Science Exchange 공급사 심사를 시작했습니다. 2026년 1월 글로벌 제약사의 승인 공급사로 등록되었고, 3월에 Science Exchange 인증 공급사가 되었습니다. 팀은 서울에 23명이며 한국어와 영어로 함께 일합니다.",
    ctas: [{ href: "/company/story", label: "회사 연혁 보기" }],
  },
];

type Props = { locale: Locale };

export function Faq({ locale }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="wrap sp-home-faq">
      <section className="sp-faq2" aria-labelledby="sp-faq2-t-home">
        <div className="sp-faq2-top">
          <h2 className="eyebrow" id="sp-faq2-t-home">
            자주 묻는 질문
          </h2>
          <a className="link" href={withLocale("/contact", locale)}>
            직접 물어보기 →
          </a>
        </div>
        <div className="sp-faq2-list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.question} className={isOpen ? "sp-faq2-item is-open" : "sp-faq2-item"}>
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
