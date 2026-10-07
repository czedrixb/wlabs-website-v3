import type { Bilingual } from "./content";

// WOS-342: the six fully-written v3 Insights articles, hand-ported from the
// v3 design repo's INSIGHT_PAGES / INS_LABEL tables
// (src/orig/wlabs-01-wired.html:1789-1869, built site/index.html — commit
// 2021e81 "Build out the Insights section"). These aren't extractor-
// harvestable: the table is a JS object literal with per-article bodies,
// figures and sources, not data-i'd markup, so — like SERVICES in
// content.ts — it's transcribed verbatim here, with the card excerpts
// (v3's n1p..n6p listing markup, :1207-1212) carried alongside since they
// differ from each article's dek.
//
// v3's taxonomy is three fixed categories with multi-tagging per article
// (`k: ['notes','news']`); CMS posts join the same taxonomy through
// Posts.ts's `categories` select field. `dateKey` is v3's `d` — a loose
// `YYYY-MM` sort key where "2026-00" means "year only, month unconfirmed"
// — and `dateLabel` is v3's `dl` display pair. Post ISO `publishedAt`
// strings extend the same `YYYY-MM` prefix, so one localeCompare sorts the
// union (see insightsIndex.ts).

export type InsightCategory = "news" | "notes" | "research";

export const INSIGHT_CATEGORIES: InsightCategory[] = ["news", "notes", "research"];

// v3's INS_LABEL (:1789).
export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, Bilingual> = {
  news: { en: "News", ko: "뉴스" },
  notes: { en: "Notes", ko: "노트" },
  research: { en: "Research", ko: "리서치" },
};

export type InsightBodyBlock = { h: Bilingual } | { p: Bilingual };
// width/height are the source files' intrinsic pixels (next/image needs
// explicit dimensions; the rail CSS scales to the column).
export type InsightFigure = { src: string; width: number; height: number; caption: Bilingual };
// `todo` marks an unverified claim (v3 wraps these in <span class="todo">,
// rendered teal by .ins-src .todo) — carried as a flag, not inline HTML.
export type InsightSource = { text: Bilingual; href?: string; todo?: boolean };
export type InsightShot = { src: string; isMark?: boolean };
export type InsightLink = { href: string; label: Bilingual; external?: boolean };

export type InsightArticle = {
  slug: string;
  dateKey: string; // v3 `d` — sort key ("2026-03"; "2026-00" = year only)
  dateLabel: Bilingual; // v3 `dl` — display pair ("2026 · 03", "2026")
  datetime: string; // the listing card's <time dateTime> (v3 :1207-1212)
  categories: InsightCategory[];
  title: Bilingual;
  excerpt: Bilingual; // listing-card copy (v3 n1p..n6p) — NOT the dek
  dek: Bilingual; // hero standfirst + related-card copy
  body: InsightBodyBlock[];
  figs?: InsightFigure[];
  sources?: InsightSource[];
  link?: InsightLink;
  shot?: InsightShot;
};

const bi = (en: string, ko: string): Bilingual => ({ en, ko });
const h = (en: string, ko: string): InsightBodyBlock => ({ h: bi(en, ko) });
const p = (en: string, ko: string): InsightBodyBlock => ({ p: bi(en, ko) });

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    slug: "ins-1",
    dateKey: "2026-03",
    dateLabel: bi("2026 · 03", "2026 · 03"),
    datetime: "2026-03",
    categories: ["notes"],
    // v3 `shot:'scix'` — an SVG logo, flagged a "mark" in theme8's SP_MARK:
    // it renders as a contained corner badge on a light plate, not a
    // bleeding photograph.
    shot: { src: "/site/img/scix-verified.svg", isMark: true },
    title: bi(
      "W Labs is now a verified supplier on Science Exchange",
      "Science Exchange 인증 공급업체가 되었습니다",
    ),
    excerpt: bi(
      "We passed the supplier qualification of Science Exchange, the R&D marketplace for life sciences. Pharmaceutical and biotech research organisations can procure W Labs' image-analysis software through the platform.",
      "라이프사이언스 R&D 마켓플레이스 Science Exchange의 공급업체 심사를 통과했습니다. 제약·바이오 연구기관이 플랫폼을 통해 W Labs의 영상 분석 소프트웨어를 조달할 수 있습니다.",
    ),
    dek: bi(
      "The supplier qualification of the life-sciences R&D marketplace is complete, and research organisations can procure our image-analysis software through the platform.",
      "라이프사이언스 R&D 마켓플레이스의 공급업체 심사를 통과했고, 연구기관이 플랫폼을 통해 저희 영상 분석 소프트웨어를 조달할 수 있습니다.",
    ),
    body: [
      p(
        "Science Exchange is the marketplace pharmaceutical and biotech organisations use to find and contract R&D suppliers. Passing its supplier qualification means W Labs is listed there as a verified party.",
        "Science Exchange는 제약·바이오 기업이 R&D 공급업체를 찾고 계약하는 마켓플레이스입니다. 공급업체 심사를 통과했다는 것은 W Labs가 검증된 주체로 등재되었다는 뜻입니다.",
      ),
      p(
        "The qualification looks at the company rather than at any one engagement. It is the marketplace’s own check that a supplier is who it says it is and can be contracted through the platform.",
        "심사는 개별 계약이 아니라 회사 자체를 봅니다. 공급업체가 스스로 밝힌 바와 같은 주체인지, 플랫폼을 통해 계약할 수 있는지를 마켓플레이스가 직접 확인하는 절차입니다.",
      ),
      p(
        "The practical effect is procurement. Research organisations can buy our image-analysis software through a channel their purchasing process already recognises, instead of opening a new vendor relationship from scratch.",
        "실질적인 효과는 조달에 있습니다. 연구기관은 새로 공급업체 관계를 트는 대신, 이미 구매 절차에서 인정하는 경로로 저희 영상 분석 소프트웨어를 도입할 수 있습니다.",
      ),
      p(
        "That matters more than it sounds. Inside a large organisation the obstacle is rarely the software — it is the months of vendor onboarding that have to happen before a purchase order can exist at all.",
        "이는 들리는 것보다 중요한 문제입니다. 큰 조직에서 걸림돌은 소프트웨어 자체인 경우가 드뭅니다. 구매 발주가 가능해지기까지 거쳐야 하는 수개월의 공급업체 등록 절차가 걸림돌입니다.",
      ),
      p(
        "What the listing does not say is anything about the software. A verified supplier is a statement about the company, not an endorsement of a product, and we would rather it was read that way.",
        "등재가 말해주지 않는 것은 소프트웨어에 관한 내용입니다. 인증 공급업체는 회사에 대한 확인이지 제품에 대한 보증이 아니며, 저희도 그렇게 읽히기를 바랍니다.",
      ),
      p("The certificate was issued in March 2026.", "인증서는 2026년 3월에 발급되었습니다."),
    ],
    sources: [
      {
        text: bi("Science Exchange — supplier marketplace", "Science Exchange — 공급업체 마켓플레이스"),
        href: "https://www.scienceexchange.com",
      },
      {
        text: bi(
          "Verified-supplier certificate issued March 2026; announced internally 2026-03-09.",
          "인증 공급업체 증서 2026년 3월 발급, 2026-03-09 사내 공지.",
        ),
      },
    ],
    link: {
      href: "https://www.scienceexchange.com",
      label: bi("Science Exchange ↗", "Science Exchange ↗"),
      external: true,
    },
  },
  {
    slug: "ins-2",
    dateKey: "2026-01",
    dateLabel: bi("2026 · 01", "2026 · 01"),
    datetime: "2026-01",
    categories: ["notes"],
    title: bi(
      "Registered as an approved vendor to a global pharmaceutical company",
      "글로벌 제약사의 승인 공급업체로 등록",
    ),
    excerpt: bi(
      "We completed the vendor registration process of a global pharmaceutical company. Approved-vendor is a specific procurement status conferred by the client.",
      "글로벌 제약사의 공급업체 등록 절차를 마쳤습니다. 승인 공급업체는 해당 기업이 부여하는 구체적인 조달 지위입니다.",
    ),
    dek: bi(
      "The vendor registration process is complete. Approved-vendor status is a specific procurement position granted by the company itself.",
      "공급업체 등록 절차를 마쳤습니다. 승인 공급업체는 해당 기업이 직접 부여하는 구체적인 조달 지위입니다.",
    ),
    body: [
      p(
        "Large pharmaceutical organisations do not contract outside their vendor register. Registration is a review of the company, not of a single project, and it is what makes future work possible at all.",
        "대형 제약 기업은 공급업체 명부 밖에서는 계약하지 않습니다. 등록은 개별 프로젝트가 아니라 회사 자체에 대한 심사이며, 이후의 모든 협업이 가능해지는 전제입니다.",
      ),
      p(
        "The review covers what a buyer has to be certain of before any scope is discussed: that the company exists as it claims, that it can invoice and be paid, that it can be held to an agreement.",
        "심사는 업무 범위를 논의하기 전에 구매자가 확실히 해야 하는 것들을 다룹니다. 회사가 밝힌 대로 실재하는지, 청구와 수금이 가능한지, 계약의 구속을 받을 수 있는지입니다.",
      ),
      p(
        "Approved-vendor status is not a partnership and it is not a contract. It is permission to be considered — which is the step that cannot be skipped, and the one that takes the longest.",
        "승인 공급업체 지위는 파트너십도 계약도 아닙니다. 검토 대상이 될 수 있다는 자격입니다. 건너뛸 수 없고, 가장 오래 걸리는 단계이기도 합니다.",
      ),
      p(
        "We are not naming the company here. The registration is confirmed; permission to use the name is a separate matter and has not been given.",
        "기업명은 밝히지 않습니다. 등록은 확인된 사실이지만, 사명 사용 허가는 별개의 문제이며 아직 받지 않았습니다.",
      ),
      p(
        "Until it is, the fact stands on its own. The register is closed, and W Labs is on it.",
        "허가를 받기 전까지는 사실만으로 충분합니다. 그 명부는 닫혀 있고, W Labs는 그 안에 있습니다.",
      ),
    ],
    sources: [
      {
        text: bi(
          "Vendor registration completed January 2026; announced internally 2026-01-16. Client name withheld pending permission.",
          "공급업체 등록 2026년 1월 완료, 2026-01-16 사내 공지. 고객사명은 허가 전까지 비공개.",
        ),
      },
    ],
  },
  {
    slug: "ins-3",
    dateKey: "2026-00",
    dateLabel: bi("2026", "2026"),
    datetime: "2026",
    categories: ["notes"],
    title: bi("D-U-N-S® registration", "D-U-N-S® 등록"),
    excerpt: bi(
      "W Labs registered a D-U-N-S® number with Dun & Bradstreet, so organisations abroad can identify and verify the company.",
      "Dun & Bradstreet의 D-U-N-S® 번호를 등록해, 해외 기관이 W Labs를 식별하고 검증할 수 있게 되었습니다.",
    ),
    dek: bi(
      "A Dun & Bradstreet D-U-N-S® number now identifies W Labs, so overseas institutions can verify the company through a standard record.",
      "Dun & Bradstreet의 D-U-N-S® 번호를 등록해, 해외 기관이 표준 기록을 통해 W Labs를 식별하고 검증할 수 있습니다.",
    ),
    body: [
      p(
        "A D-U-N-S® number is the identifier most international procurement, grant and partnership processes ask for first. Without one, a Korean company is difficult for a foreign institution to check.",
        "D-U-N-S® 번호는 해외 조달·보조금·파트너십 절차에서 가장 먼저 요구하는 식별자입니다. 번호가 없으면 해외 기관이 한국 기업을 확인하기 어렵습니다.",
      ),
      p(
        "Dun & Bradstreet issues it against the company’s own records, and the number then travels with the company: one reference a counterparty abroad can look up, rather than a folder of documents they have to take on trust.",
        "Dun & Bradstreet는 회사의 기록을 근거로 번호를 발급하며, 이후 그 번호는 회사를 따라다닙니다. 해외 상대방이 믿고 받아들여야 하는 서류 묶음 대신, 직접 조회할 수 있는 하나의 참조가 생기는 것입니다.",
      ),
      p(
        "The registration removes that step as an obstacle. It says nothing about the work itself — it only makes the company legible abroad.",
        "등록으로 그 단계가 장애물에서 사라졌습니다. 업무 자체에 대해 말해주는 것은 없고, 해외에서 회사를 확인할 수 있게 할 뿐입니다.",
      ),
      p(
        "Taken with the Science Exchange listing and the vendor registration, it is the same groundwork laid in three places. Before anyone can buy, they have to be able to verify.",
        "Science Exchange 등재, 공급업체 등록과 함께 보면 같은 기초 작업을 세 곳에 해둔 셈입니다. 누군가 구매하기 전에, 먼저 확인할 수 있어야 하기 때문입니다.",
      ),
    ],
    sources: [
      {
        text: bi(
          "D-U-N-S® 696568010 — Dun & Bradstreet registered profile.",
          "D-U-N-S® 696568010 — Dun & Bradstreet 등록 프로필.",
        ),
      },
      {
        text: bi(
          "Registration month not yet confirmed; shown as 2026 pending the record.",
          "등록 월 미확인 — 기록 확인 전까지 2026으로 표기.",
        ),
        todo: true,
      },
    ],
  },
  {
    slug: "ins-4",
    dateKey: "2026-08",
    dateLabel: bi("2026 · 08", "2026 · 08"),
    datetime: "2026-08",
    categories: ["notes"],
    shot: { src: "/site/img/skinarch-brainarch.webp" },
    figs: [
      {
        src: "/site/img/skinarch-cat-1.webp",
        width: 1400,
        height: 933,
        caption: bi(
          "Scan stack, B-scan with the DEJ overlay, and the results panel.",
          "스캔 스택, DEJ 오버레이가 적용된 B-scan, 그리고 결과 패널.",
        ),
      },
      {
        src: "/site/img/brainarch-cat-1.webp",
        width: 1400,
        height: 788,
        caption: bi(
          "BrainArch: the segmentation boundary drawn on the source CT slice.",
          "BrainArch — 원본 CT 슬라이스 위에 표시된 분할 경계.",
        ),
      },
    ],
    title: bi(
      "SkinArch and BrainArch become product lines of their own",
      "SkinArch와 BrainArch, 독립 제품 라인으로",
    ),
    excerpt: bi(
      "LC-OCT skin-structure analysis and brain-CT image analysis are now separate products. Both are Research Use Only software.",
      "LC-OCT 피부 구조 분석과 뇌 CT 영상 분석을 각각의 제품으로 정리했습니다. 두 제품 모두 연구용(Research Use Only) 소프트웨어입니다.",
    ),
    dek: bi(
      "LC-OCT skin-structure analysis and brain CT image analysis are now organised as separate products. Both are research-use-only software.",
      "LC-OCT 피부 구조 분석과 뇌 CT 영상 분석을 각각의 제품으로 정리했습니다. 두 제품 모두 연구용(Research Use Only) 소프트웨어입니다.",
    ),
    body: [
      p(
        "The two had been described together as imaging work. They answer different questions, for different readers, on different equipment, so carrying them under one name was costing clarity on both sides.",
        "두 제품은 그동안 영상 분석 업무로 묶여 설명되었습니다. 서로 다른 장비에서, 서로 다른 사용자를 위해, 서로 다른 질문에 답하는 제품이라 하나의 이름으로 묶는 것은 양쪽 모두의 명확성을 해쳤습니다.",
      ),
      h("SkinArch", "SkinArch"),
      p(
        "SkinArch works on LC-OCT scans of skin. It segments the dermal–epidermal junction and reports measurements taken from it, with the trace shown on the scan so a reader can see where the numbers came from.",
        "SkinArch는 피부의 LC-OCT 스캔을 다룹니다. 진피-표피 경계(DEJ)를 분할하고 그로부터 얻은 측정값을 제시하며, 스캔 위에 경계선을 함께 표시해 수치의 출처를 확인할 수 있게 합니다.",
      ),
      h("BrainArch", "BrainArch"),
      p(
        "BrainArch works on brain CT slices. It marks a region on the source image, so what is shown is which pixels were included rather than a verdict about them.",
        "BrainArch는 뇌 CT 슬라이스를 다룹니다. 원본 영상 위에 영역을 표시하므로, 제시되는 것은 해당 영역에 대한 판정이 아니라 어떤 픽셀이 포함되었는가입니다.",
      ),
      h("Why separate them", "분리하는 이유"),
      p(
        "Separating them also keeps each one honest about its scope. Both remain research-use-only: they measure, segment and reconstruct, and they do not diagnose, screen or assess.",
        "분리는 각 제품이 자신의 범위를 정확히 밝히게 하는 일이기도 합니다. 두 제품 모두 연구용입니다. 측정·분할·재구성을 수행하며, 진단이나 선별, 평가를 하지 않습니다.",
      ),
      p(
        "The split is organisational before it is technical. Nothing inside either product changed on the day the names did — what changed is that each can now be described, documented and sold as the thing it actually is.",
        "이 분리는 기술적 변화이기 이전에 조직적 정리입니다. 이름이 바뀐 날 제품 내부에서 달라진 것은 없습니다. 달라진 것은 각 제품을 있는 그대로 설명하고, 문서화하고, 판매할 수 있게 되었다는 점입니다.",
      ),
    ],
    sources: [
      {
        text: bi("SkinArch and BrainArch product pages", "SkinArch·BrainArch 제품 페이지"),
        href: "/work/products",
      },
      { text: bi("Product lines separated August 2026.", "2026년 8월 제품 라인 분리.") },
    ],
    link: { href: "/work/products", label: bi("Products →", "제품 →") },
  },
  {
    slug: "ins-5",
    dateKey: "2023",
    dateLabel: bi("2023", "2023"),
    datetime: "2023",
    categories: ["notes", "news"],
    title: bi(
      "When the budget stops being visible, a system becomes necessary",
      "예산이 보이지 않을 때, 시스템이 필요해집니다",
    ),
    excerpt: bi(
      '"As the client\'s business grew, managing project budget expenditures became difficult." A project-management system began with that one sentence from a client — build, integrate, and a view that makes supervision easy.',
      '"사업이 성장하면서 프로젝트 예산 집행을 관리하기 어려워졌다." 한 고객사의 이 한 문장에서 프로젝트 관리 시스템이 시작되었습니다. 구축과 연동, 그리고 쉽게 감독할 수 있는 화면까지.',
    ),
    dek: bi(
      '"As the client’s business grew, managing project budget expenditures became difficult." A project-management system began with that one sentence.',
      '"사업이 성장하면서 프로젝트 예산 집행을 관리하기 어려워졌다." 한 고객사의 이 한 문장에서 프로젝트 관리 시스템이 시작되었습니다.',
    ),
    body: [
      p(
        "The brief was not a feature list. It was a description of a thing that had stopped working: spending that used to be possible to hold in your head, and no longer was.",
        "브리프는 기능 목록이 아니었습니다. 작동을 멈춘 상태에 대한 설명이었습니다. 머릿속에 담아둘 수 있던 지출이, 더 이상 그렇지 않게 된 것입니다.",
      ),
      p(
        "That is the most useful kind of brief to receive. It names the symptom and leaves the diagnosis open, which is the only way the diagnosis can turn out to be something neither side expected.",
        "이런 브리프가 가장 유용합니다. 증상을 말하되 진단은 열어두기 때문입니다. 그래야 진단이 양쪽 모두 예상하지 못한 결론으로 갈 수 있습니다.",
      ),
      p(
        "So the work was build, integrate, and then a view that makes supervision easy — the last part being the one the sentence was actually asking for.",
        "그래서 작업은 구축과 연동, 그리고 쉽게 감독할 수 있는 화면까지였습니다. 그 한 문장이 실제로 요청한 것은 마지막 부분이었습니다.",
      ),
      p(
        "A system like this earns its keep in the last mile. Collecting the figures is the work; the point of the project is the moment someone can look at one screen and tell whether a project is on budget.",
        "이런 시스템의 값어치는 마지막 구간에서 드러납니다. 수치를 모으는 것은 작업이고, 프로젝트의 목적은 누군가 화면 하나를 보고 예산 집행 상태를 판단할 수 있게 되는 순간입니다.",
      ),
      p(
        "It is the clearest example we have of defining the problem before choosing the technology.",
        "기술을 고르기 전에 문제를 먼저 정의한다는 원칙의, 저희가 가진 가장 분명한 사례입니다.",
      ),
    ],
    sources: [
      {
        text: bi(
          "Project brief, 2023. The quoted sentence is W Labs’ own record of the brief; the client is not named.",
          "2023년 프로젝트 브리프. 인용 문장은 W Labs가 기록한 브리프 내용이며, 고객사명은 밝히지 않습니다.",
        ),
      },
    ],
  },
  {
    slug: "ins-6",
    dateKey: "2026-09",
    dateLabel: bi("2026 · 09", "2026 · 09"),
    datetime: "2026-09",
    categories: ["research", "news"],
    title: bi("Finding colorectal polyps with a smartphone", "스마트폰으로 대장 용종 찾기"),
    excerpt: bi(
      "Between 6% and 27% of polyps are missed during colonoscopy, and the commercial AI systems that address this stay tied to expensive proprietary hardware. A pilot study on a Galaxy S9 running EfficientDet Lite2 tested how far general-purpose hardware gets.",
      "대장내시경 검사에서 용종의 6~27%가 발견되지 않습니다. 이를 보완하는 상용 AI 시스템은 고가의 전용 하드웨어에 묶여 있습니다. 갤럭시 S9에서 EfficientDet Lite2를 구동한 파일럿 연구로 범용 기기로 어디까지 가능한지 확인했습니다.",
    ),
    dek: bi(
      "Between 6% and 27% of polyps are missed during colonoscopy, and the commercial AI systems that address this stay tied to expensive proprietary hardware.",
      "대장내시경 검사에서 용종의 6~27%가 발견되지 않습니다. 이를 보완하는 상용 AI 시스템은 고가의 전용 하드웨어에 묶여 있습니다.",
    ),
    body: [
      p(
        "The miss rate is the reason the problem is worth automating at all. Detection assistance exists — Medtronic’s GI Genius is the best-known — but it arrives as a dedicated box attached to a dedicated tower.",
        "발견 실패율은 이 문제를 자동화할 가치가 있는 이유 그 자체입니다. 검출 보조 시스템은 이미 존재하고 Medtronic의 GI Genius가 가장 잘 알려져 있지만, 전용 타워에 연결되는 전용 장비 형태로 제공됩니다.",
      ),
      p(
        "That packaging is what limits reach. A system that only runs on equipment a department has to buy will not reach the rooms that have the highest miss rates.",
        "그 형태가 확산을 가로막습니다. 부서가 따로 구매해야 하는 장비에서만 동작하는 시스템은, 정작 발견 실패율이 가장 높은 현장에 닿지 못합니다.",
      ),
      h("The pilot", "파일럿 연구"),
      p(
        "The pilot asked a narrow question: how far does general-purpose hardware get? We ran EfficientDet Lite2 on a Galaxy S9 — a phone released in 2018, chosen precisely because it is unremarkable.",
        "파일럿 연구의 질문은 좁았습니다. 범용 하드웨어로 어디까지 갈 수 있는가. 2018년 출시된 갤럭시 S9에서 EfficientDet Lite2를 구동했습니다. 평범한 기기라는 점이 선택의 이유였습니다.",
      ),
      p(
        "A phone is not a better computer than the dedicated box. It is a cheaper one that is already in the room, and at this kind of scale that is a different sort of advantage.",
        "스마트폰이 전용 장비보다 좋은 컴퓨터는 아닙니다. 다만 이미 현장에 있는 더 싼 컴퓨터이며, 확산의 규모에서는 그것이 다른 종류의 이점입니다.",
      ),
      h("What it establishes", "확인한 것"),
      p(
        "The result is a direction, not a product. It is research-use-only work and makes no clinical claim; what it establishes is that the cost floor for this kind of assistance may be far lower than the current one.",
        "결과는 제품이 아니라 방향입니다. 연구용 작업이며 어떤 임상적 주장도 하지 않습니다. 다만 이런 보조 기능의 비용 하한이 지금보다 훨씬 낮을 수 있다는 점을 보여줍니다.",
      ),
    ],
    sources: [
      {
        text: bi(
          "W Labs pilot study, 2026 — EfficientDet Lite2 on a Galaxy S9. Research use only.",
          "W Labs 파일럿 연구, 2026 — 갤럭시 S9에서 EfficientDet Lite2 구동. 연구용.",
        ),
      },
      {
        text: bi(
          "Polyp miss rate of 6–27%: literature citation still to be supplied.",
          "용종 발견 실패율 6~27%: 참고 문헌 출처 추가 필요.",
        ),
        todo: true,
      },
      {
        text: bi(
          "GI Genius referenced as a commercial comparator; product reference to be added.",
          "GI Genius는 상용 비교 대상으로 언급 — 제품 출처 추가 필요.",
        ),
        todo: true,
      },
    ],
  },
];

export function getInsightArticle(slug: string): InsightArticle | undefined {
  return INSIGHT_ARTICLES.find((a) => a.slug === slug);
}
