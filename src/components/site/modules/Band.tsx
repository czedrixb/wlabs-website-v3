import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { SpectrogramStack, type StackItem } from "./SpectrogramStack";

// Real content from site/index.html's #home-services instance (the same
// five services also shown in full on /work/services, WOS-314 Step 6+).
// Korean only for now, matching every other site-chrome piece so far —
// the EN dictionary is Step 5.
const SERVICE_COPY = [
  {
    key: "intelligence",
    number: "01",
    question: "AI·지능형 자동화",
    teaser: "문서, 이미지, 업무 흐름을 이해하는 AI를 실제 운영 환경에 맞게 구현합니다.",
    answer: "문서, 이미지, 업무 흐름을 이해하는 AI를 실제 운영 환경에 맞게 구현합니다.",
  },
  {
    key: "creation",
    number: "02",
    question: "맞춤 소프트웨어 개발",
    teaser: "학사 관리부터 물류 배차, 주문 플랫폼까지, 현장에 맞는 소프트웨어를 설계하고 개발합니다.",
    answer: "학사 관리부터 물류 배차, 주문 플랫폼까지, 현장에 맞는 소프트웨어를 설계하고 개발합니다.",
  },
  {
    key: "insight",
    weight: 1.1,
    number: "03",
    question: "데이터·이미징 인텔리전스",
    teaser: "복잡한 이미지와 데이터를 측정·분할·재구성해 연구에 필요한 정보로 바꿉니다.",
    answer: "복잡한 이미지와 데이터를 측정·분할·재구성해 연구에 필요한 정보로 바꿉니다.",
  },
  {
    key: "experience",
    number: "04",
    question: "UI/UX·제품 디자인",
    teaser: "두 언어로 쓰이는 제품의 인터페이스, 프로토타입, 디자인 시스템을 만듭니다.",
    answer: "두 언어로 쓰이는 제품의 인터페이스, 프로토타입, 디자인 시스템을 만듭니다.",
  },
  {
    key: "evolution",
    number: "05",
    question: "현대화·운영 지원",
    teaser: "기존 시스템의 맥락을 지키며 구조를 전환하고, 출시 이후의 운영을 함께합니다.",
    answer: "기존 시스템의 맥락을 지키며 구조를 전환하고, 출시 이후의 운영을 함께합니다.",
  },
];

type Props = { locale: Locale };

// Home's #home-services section — a .section-head (shared with every other
// Home section) wrapping the five-service band stack. Ported from
// site/index.html's #home-services block; the band engine itself lives in
// SpectrogramStack.tsx.
export function Band({ locale }: Props) {
  const items: StackItem[] = SERVICE_COPY.map((s) => ({
    key: s.key,
    weight: s.weight,
    number: s.number,
    question: s.question,
    questionText: s.question,
    teaser: s.teaser,
    teaserText: s.teaser,
    answer: <p>{s.answer}</p>,
    answerText: s.answer,
    ctas: [
      { href: withLocale("/work/services", locale), label: "자세히 보기" },
      { href: withLocale("/contact", locale), label: "필요한 것부터 찾아보기", ghost: true },
    ],
  }));

  return (
    <div className="section wrap" id="home-services">
      <div className="section-head">
        <div>
          <span className="eyebrow">서비스</span>
          <h2 style={{ marginTop: 12 }}>다섯 가지 방식으로 함께합니다.</h2>
        </div>
        <p className="lead">
          한 가지 기능의 개발부터 시스템 전체의 전환까지. 기술을 먼저 정하지 않고, 풀어야 할 문제부터
          함께 정의합니다.
        </p>
      </div>
      <section className="sp-bands" aria-labelledby="sp-bands-svc-title">
        <h3 className="sp-bands-sr" id="sp-bands-svc-title">
          서비스
        </h3>
        <SpectrogramStack items={items} />
      </section>
      <div className="sp-ctas">
        <a className="link" href={withLocale("/work/services", locale)}>
          다섯 가지 방식 보기 →
        </a>
      </div>
    </div>
  );
}
