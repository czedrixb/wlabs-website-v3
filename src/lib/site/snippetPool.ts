import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { siteT } from "./dictionary";
import { PROJECTS, PRODUCTS, PRODUCT_ORDER, SERVICES, TEAM, TEAM_GROUPS } from "./content";

export type SnippetPoolItem = {
  kind: string;
  title: string;
  sub: string;
  href: string;
};

// The hero's node-tips snippet pool — v3's `buildPool()`
// (site/index.html:3586): "gathered from the whole site — projects,
// products, services, team, story, insights, principles, proof — then
// dealt at random" as small callouts riding the hero mark's wave paths.
// Resolved to one language here (this port picks locale server-side
// everywhere, not at runtime like v3's `lang==='en'` checks), and routed
// to real pages instead of the source's hash-router targets
// (`#project/id` → `/projects/id`, etc.) — v3's `data-tab`/`data-panel`
// pair becomes a plain href.
//
// A few entries carry literal (untranslated) strings straight from the
// source rather than a dictionary key — same convention as
// dictionary.ts's STORY_ARIA_LABEL: v3 never internationalized them either
// (service blurbs, the timeline-year captions, the proof stats' own
// English-only badges, the inquiry card).
const SERVICE_BLURBS: Record<string, { en: string; ko: string }> = {
  intelligence: { en: "Computer vision · NLP · workflow AI", ko: "컴퓨터 비전 · NLP · 워크플로 AI" },
  creation: { en: "Web platforms · SaaS · full-stack", ko: "웹 플랫폼 · SaaS · 풀스택" },
  insight: { en: "LC-OCT · segmentation · 3D reconstruction", ko: "LC-OCT · 분할 · 3D 재구성" },
  experience: { en: "Research · design systems · prototypes", ko: "리서치 · 디자인 시스템 · 프로토타입" },
  evolution: { en: "Migration · maintenance · monitoring", ko: "마이그레이션 · 유지보수 · 모니터링" },
};

const STORY_YEARS: { year: string; en: string; ko: string }[] = [
  { year: "2022", en: "The first client project", ko: "첫 고객사 프로젝트" },
  { year: "2023", en: "Into education and operations", ko: "교육과 운영 시스템으로" },
  { year: "2024", en: "Consumer apps and language services", ko: "컨슈머 앱과 언어 서비스" },
  { year: "2025", en: "Logistics, retail — and groundwork", ko: "물류, 리테일, 그리고 준비" },
  { year: "2026", en: "A life-sciences partner", ko: "라이프사이언스 파트너로" },
];

const PROOF_ITEMS: { title: string; en: string; ko: string }[] = [
  { title: "24", en: "Client projects delivered", ko: "수행한 고객사 프로젝트" },
  { title: "Since 2022", en: "Delivering client work continuously", ko: "중단 없이 이어온 프로젝트 수행" },
  { title: "Verified", en: "Supplier on Science Exchange", ko: "Science Exchange 인증 공급업체" },
  { title: "Approved", en: "Vendor to a global pharmaceutical company", ko: "글로벌 제약사 승인 공급업체" },
];

const INQUIRY = { title: { en: "Your project", ko: "당신의 프로젝트" }, sub: { en: "Tell us what you want to change", ko: "무엇을 바꾸고 싶은지 알려 주세요" } };

// v3 truncates insight headings differently per language (28/26 chars EN,
// 18/17 chars KO) since Korean reads wider per character.
function truncate(text: string, en: boolean): string {
  const limit = en ? 28 : 18;
  const cut = en ? 26 : 17;
  return text.length > limit ? `${text.slice(0, cut).trim()}…` : text;
}

export function buildSnippetPool(locale: Locale): SnippetPoolItem[] {
  const en = locale === "en";
  const s = siteT(locale);
  const items: SnippetPoolItem[] = [];

  for (const p of PROJECTS) {
    items.push({
      kind: en ? "Project" : "프로젝트",
      title: (en ? p.title.en : p.title.ko).replace(/\s[—-].*$/, ""),
      sub: en ? p.desc.en : p.desc.ko,
      href: withLocale(`/projects/${p.id}`, locale),
    });
  }

  for (const id of PRODUCT_ORDER) {
    const product = PRODUCTS[id];
    items.push({
      kind: en ? "Product" : "제품",
      title: product.name,
      sub: en ? product.cat.en : product.cat.ko,
      href: withLocale(`/products/${id}`, locale),
    });
  }

  for (const svc of SERVICES) {
    const blurb = SERVICE_BLURBS[svc.id];
    items.push({
      kind: en ? "Service" : "서비스",
      title: en ? svc.name.en : svc.name.ko,
      sub: en ? blurb.en : blurb.ko,
      href: withLocale(`/work/services#${svc.anchor}`, locale),
    });
  }

  for (const group of TEAM_GROUPS) {
    const n = group.members.length;
    items.push({
      kind: en ? "Team" : "팀",
      title: en ? group.label.en : group.label.ko,
      sub: en ? `${n} ${n > 1 ? "people" : "person"}` : `${n}명`,
      href: withLocale("/company/team", locale),
    });
  }
  items.push({
    kind: en ? "Team" : "팀",
    title: en ? `${TEAM.length} people` : `${TEAM.length}명`,
    sub: en ? "Management · Dev · Design · QA · Marketing" : "경영 · 개발 · 디자인 · QA · 마케팅",
    href: withLocale("/company/team", locale),
  });

  for (const y of STORY_YEARS) {
    items.push({
      kind: en ? "Story" : "이야기",
      title: y.year,
      sub: en ? y.en : y.ko,
      href: withLocale("/company/story", locale),
    });
  }

  const insightHeads = [s.insights.n1h, s.insights.n2h, s.insights.n3h, s.insights.n4h, s.insights.n5h];
  insightHeads.forEach((head, i) => {
    items.push({
      kind: en ? "Insights" : "인사이트",
      title: truncate(head, en),
      sub: head,
      href: withLocale(`/company/insights#ins-${i + 1}`, locale),
    });
  });

  const principles = [s.company.v1h, s.company.v2h, s.company.v3h, s.company.v4h];
  principles.forEach((head, i) => {
    items.push({
      kind: en ? "Principle" : "원칙",
      title: String(i + 1).padStart(2, "0"),
      sub: head,
      href: withLocale("/company/story", locale),
    });
  });

  for (const p of PROOF_ITEMS) {
    items.push({ kind: en ? "Proof" : "근거", title: p.title, sub: en ? p.en : p.ko, href: withLocale("/company/story", locale) });
  }

  items.push({
    kind: en ? "Inquiry" : "문의",
    title: en ? INQUIRY.title.en : INQUIRY.title.ko,
    sub: en ? INQUIRY.sub.en : INQUIRY.sub.ko,
    href: withLocale("/contact", locale),
  });

  return items;
}
