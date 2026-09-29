// Nav structure only — labels are the authored Korean markup for now (v3's
// own "Korean is the markup, English lives in a dict" convention); the EN
// dictionary itself is WOS-314's i18n-extraction step, not yet wired here.

export type NavLeaf = { href: string; label: string; sub?: string };
export type NavItem = { href: string; label: string; children?: NavLeaf[] };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈" },
  {
    href: "/work",
    label: "하는 일",
    children: [
      { href: "/work/services", label: "서비스", sub: "다섯 가지 협업 방식" },
      { href: "/work/products", label: "제품", sub: "SkinArch · WIZ · BrainArch" },
      { href: "/work/cases", label: "프로젝트", sub: "고객사와 만든 것들" },
    ],
  },
  {
    href: "/company",
    label: "회사",
    children: [
      { href: "/company/story", label: "회사 이야기", sub: "2022년부터, 문제를 먼저 정의하는 방식" },
      { href: "/company/team", label: "팀", sub: "23명의 사람들" },
      { href: "/company/insights", label: "인사이트", sub: "회사 소식과 제품 노트" },
    ],
  },
  { href: "/search", label: "검색" },
  { href: "/contact", label: "프로젝트 문의" },
];

export const TABBAR_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/work", label: "하는 일" },
  { href: "/company", label: "회사" },
  { href: "/search", label: "검색" },
  { href: "/contact", label: "문의" },
];
