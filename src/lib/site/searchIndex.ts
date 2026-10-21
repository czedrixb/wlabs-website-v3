import { V3_STRINGS } from "./dictionary.generated";
import { listAisenPosts, type AisenPostCard } from "@/lib/aisen";
import { insightPath } from "@/lib/site/insightPath";
import {
  CHIP_TIPS,
  PROJECTS,
  PRODUCTS,
  PRODUCT_ORDER,
  SERVICES,
  TEAM,
  TEAM_GROUPS,
  type Bilingual,
} from "./content";

// WOS-336: the /search screen's client-side index — v3's build()
// (site/index.html:3656-3665) assembled from the same data tables the rest
// of the site renders, so nothing here can drift from the real catalogue.
// Built on the server (it's all static content) and passed to SearchClient
// as a plain JSON prop; both languages travel in every entry because v3
// searches both regardless of the active language (its `norm` concatenates
// EN and KO).
//
// Hash-routes become this repo's real routes: #project/<id> →
// /projects/<id>, #product/<id> → /products/<id>, the panel links →
// /work/* and /company/*, with v3's `scroll` targets carried as `hash`.
// v3 points its Privacy/Terms page entries at #contact; this repo's
// footer resolves them to /company (the legal pages don't exist yet), and
// the index follows the footer.

export type SearchKind = "project" | "product" | "service" | "team" | "story" | "insight" | "term" | "page";

export type SearchIndexEntry = {
  kind: SearchKind;
  title: Bilingual;
  body: Bilingual;
  href: string; // locale-less; SearchClient applies withLocale
  hash?: string; // in-page anchor (v3's data-scroll)
  /**
   * WOS-346: full locale-prefixed overrides for entries whose two language
   * versions don't live at the prefix-swapped URL — AISEN posts publish each
   * language independently (possibly under a different slug), so an en
   * visitor clicking a ko-only post must land on /ko/insights/… instead of
   * a 404. SearchClient prefers this over withLocale(href) when present.
   */
  hrefByLocale?: Partial<Record<"ko" | "en", string>>;
};

// v3's five hard-coded page rows (index.html:3664) — [en, ko, bodyEn, bodyKo].
const PAGE_ROWS: [string, string, string, string, string][] = [
  ["Work", "하는 일", "Services, products and projects", "서비스, 제품, 프로젝트", "/work"],
  ["Company", "회사", "Our story, team and insights", "회사 이야기, 팀, 인사이트", "/company"],
  ["Project Inquiry", "프로젝트 문의", "Tell us what you want to change", "무엇을 바꾸고 싶은지 알려 주세요", "/contact"],
  ["Privacy policy", "개인정보처리방침", "How we handle personal data", "개인정보 처리 방식", "/company"],
  ["Terms", "이용약관", "Terms of service", "서비스 이용약관", "/company"],
];

// Async since WOS-346: the insight rows come from the AISEN Blog API (60s
// unstable_cache in aisen.ts) instead of the deleted static articles. The
// rest of the index is still the same static content tables.
export async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const entries: SearchIndexEntry[] = [];
  const workKo = V3_STRINGS.ko.work;
  const workEn = V3_STRINGS.en.work;
  const coKo = V3_STRINGS.ko.company;
  const coEn = V3_STRINGS.en.company;

  for (const p of PROJECTS) {
    entries.push({
      kind: "project",
      title: p.title,
      body: {
        en: `${p.desc.en} ${p.tag.en} ${p.list.map((l) => l.en).join(" ")}`,
        ko: `${p.desc.ko} ${p.tag.ko} ${p.list.map((l) => l.ko).join(" ")}`,
      },
      href: `/projects/${p.id}`,
    });
  }

  for (const id of PRODUCT_ORDER) {
    const p = PRODUCTS[id];
    entries.push({
      kind: "product",
      title: { en: p.name, ko: p.name },
      body: {
        en: `${p.lead.en} ${p.feats.map((f) => `${f.title.en} ${f.body.en}`).join(" ")} ${p.who.en}`,
        ko: `${p.lead.ko} ${p.feats.map((f) => `${f.title.ko} ${f.body.ko}`).join(" ")} ${p.who.ko}`,
      },
      href: `/products/${id}`,
    });
  }

  SERVICES.forEach((svc, i) => {
    const dKey = `d${i + 1}` as "d1" | "d2" | "d3" | "d4" | "d5";
    const chips = svc.chips.join(" ");
    entries.push({
      kind: "service",
      title: svc.name,
      body: { en: `${workEn[dKey]} ${chips}`, ko: `${workKo[dKey]} ${chips}` },
      href: "/work/services",
      hash: svc.anchor,
    });
  });

  for (const m of TEAM) {
    const group = TEAM_GROUPS.find((g) => g.id === m.group);
    const title = m.nameKo ? `${m.name} · ${m.nameKo}` : m.name;
    entries.push({
      kind: "team",
      title: { en: title, ko: title },
      body: {
        en: `${m.role.en} ${group?.label.en ?? ""}`,
        ko: `${m.role.ko} ${group?.label.ko ?? ""}`,
      },
      href: "/company/team",
    });
  }

  for (const n of [1, 2, 3, 4, 5] as const) {
    entries.push({
      kind: "story",
      title: { en: coEn[`tl${n}h`], ko: coKo[`tl${n}h`] },
      body: { en: coEn[`tl${n}p`], ko: coKo[`tl${n}p`] },
      href: "/company/story",
    });
  }

  // WOS-342/WOS-346: insight results open the article itself. Both AISEN
  // language lists are zipped via each ko post's `translations` so one row
  // still searches both languages (v3's norm concatenates EN and KO);
  // untranslated posts fall back to Korean text, and hrefByLocale keeps an
  // en visitor off the 404 that the prefix-swapped URL would be. Guarded
  // like every AISEN read: a cold-cache outage just drops the insight rows.
  let aisenKo: AisenPostCard[] = [];
  let aisenEn: AisenPostCard[] = [];
  try {
    [aisenKo, aisenEn] = await Promise.all([listAisenPosts("ko"), listAisenPosts("en")]);
  } catch {
    // Index ships without insight rows this pass.
  }
  const enBySlug = new Map(aisenEn.map((c) => [c.slug, c]));
  const enSlugsZipped = new Set<string>();
  for (const ko of aisenKo) {
    const enSlug = ko.translations.find((t) => t.locale === "en")?.slug;
    const en = enSlug ? enBySlug.get(enSlug) : undefined;
    if (enSlug) enSlugsZipped.add(enSlug);
    entries.push({
      kind: "insight",
      title: { ko: ko.title, en: en?.title ?? ko.title },
      body: { ko: ko.excerpt ?? "", en: en?.excerpt ?? ko.excerpt ?? "" },
      href: insightPath(ko.slug),
      hrefByLocale: {
        ko: `/ko${insightPath(ko.slug)}`,
        en: en ? `/en${insightPath(en.slug)}` : `/ko${insightPath(ko.slug)}`,
      },
    });
  }
  for (const en of aisenEn) {
    if (enSlugsZipped.has(en.slug)) continue;
    entries.push({
      kind: "insight",
      title: { ko: en.title, en: en.title },
      body: { ko: en.excerpt ?? "", en: en.excerpt ?? "" },
      href: insightPath(en.slug),
      hrefByLocale: { ko: `/en${insightPath(en.slug)}`, en: `/en${insightPath(en.slug)}` },
    });
  }

  for (const t of CHIP_TIPS) {
    entries.push({
      kind: "term",
      title: { en: t.term, ko: t.term },
      body: t.tip,
      href: "/work/services",
    });
  }

  for (const [en, ko, bodyEn, bodyKo, href] of PAGE_ROWS) {
    entries.push({ kind: "page", title: { en, ko }, body: { en: bodyEn, ko: bodyKo }, href });
  }

  return entries;
}
