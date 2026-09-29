import type { SiteStrings } from "@/lib/site/dictionary";

// Nav structure only — labels come from the dictionary (src/lib/site/
// dictionary.ts), built fresh per locale by buildNav()/buildTabbarItems().
// Both take an already-resolved `SiteStrings["chrome"]` slice rather than a
// `locale` (and only import the dictionary's *type*, which erases at
// compile time) so Header/TabBar — both 'use client' — never need to
// import the dictionary module itself: (site)/layout.tsx resolves it once
// on the server and passes the slice down as a prop, so only the active
// locale's strings enter the client bundle, not both.

export type NavLeaf = { href: string; label: string; sub?: string };
export type NavItem = { href: string; label: string; children?: NavLeaf[]; subAriaLabel?: string };

export function buildNav(s: SiteStrings["chrome"]): NavItem[] {
  return [
    { href: "/", label: s.tabHome },
    {
      href: "/work",
      label: s.tabWork,
      subAriaLabel: s.workSeg,
      children: [
        { href: "/work/services", label: s.segServices, sub: s.subServices },
        { href: "/work/products", label: s.segProducts, sub: s.subProducts },
        { href: "/work/cases", label: s.segCases, sub: s.subCases },
      ],
    },
    {
      href: "/company",
      label: s.tabCompany,
      subAriaLabel: s.coSeg,
      children: [
        { href: "/company/story", label: s.story, sub: s.subStory },
        { href: "/company/team", label: s.team, sub: s.subTeam },
        { href: "/company/insights", label: s.insights, sub: s.subInsights },
      ],
    },
    { href: "/search", label: s.tabSearch },
    { href: "/contact", label: s.tabContact },
  ];
}

export type TabbarItem = { href: string; label: string };

export function buildTabbarItems(s: SiteStrings["chrome"]): TabbarItem[] {
  return [
    { href: "/", label: s.tabHome },
    { href: "/work", label: s.tabWork },
    { href: "/company", label: s.tabCompany },
    { href: "/search", label: s.tabSearch },
    { href: "/contact", label: s.tabContactShort },
  ];
}
