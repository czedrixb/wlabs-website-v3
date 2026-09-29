import { V3_CONTENT } from "./content.generated";
import { V3_STRINGS } from "./dictionary.generated";

// The site's people/projects/products/services content — the typed
// analogue of dictionary.ts, and the shape WOS-333's Payload collections
// seed from. Everything here is locale-agnostic: v3 stores content as
// [en, ko] tuples and switches with CSS (`html:lang(en) [lang="ko"].alt`);
// this port resolves locale on the server instead, so every string pair
// becomes a named `Bilingual` a caller picks `.ko`/`.en` off of.
//
// TEAM/GROUPS/PROJECTS/CATS/PRODUCT_PAGES come from content.generated.ts
// (scripts/extract-v3-content.mjs, harvested from the v3 design repo's own
// data tables). SERVICES comes from `SVC_ROWS`, which lives in Python
// (src/splice.py) rather than the built HTML, so there is nothing for that
// extractor to harvest — it's transcribed below instead, matching
// Band.tsx's pre-existing SERVICE_META (moved here so both Band and every
// Work/product/project page read one definition, not two). FAQ text
// already went through WOS-331's dictionary harvest (`spFaqQ1-8`); it's
// exposed here as a locale-agnostic array pulled straight from the raw
// generated dictionary, both languages, for WOS-333 to seed a collection
// from without calling siteT(locale) twice.

export type Bilingual = { ko: string; en: string };

function bi(en: string, ko: string): Bilingual {
  return { en, ko };
}

// ── Team ────────────────────────────────────────────────────────────────

export type TeamGroupId = "mgmt" | "dev" | "design" | "qa" | "biz" | "tbc";

export type TeamMember = {
  name: string;
  nameKo: string | null;
  role: Bilingual;
  photo: string | null;
  group: TeamGroupId;
};

export type TeamGroup = {
  id: TeamGroupId;
  label: Bilingual;
  members: TeamMember[];
};

// Flat, source order — Home's six-face teaser is TEAM.slice(0, 6), same as
// v3's own `TEAM.slice(0,6)` (site/index.html's renderTeam()).
export const TEAM: TeamMember[] = V3_CONTENT.team.map(([name, nameKo, roleEn, roleKo, photo, group]) => ({
  name,
  nameKo: nameKo || null,
  role: bi(roleEn, roleKo),
  photo: photo || null,
  group: group as TeamGroupId,
}));

// GROUPS order, with empty groups dropped — `tbc` ("role to be confirmed")
// has no members in the current roster, so it never renders.
export const TEAM_GROUPS: TeamGroup[] = V3_CONTENT.groups
  .map(([id, en, ko]) => ({
    id: id as TeamGroupId,
    label: bi(en, ko),
    members: TEAM.filter((m) => m.group === id),
  }))
  .filter((g) => g.members.length > 0);

// ── Projects ────────────────────────────────────────────────────────────

export type ProjectCatId = "health" | "edu" | "lang" | "prod";

export type ProjectCat = { id: "all" | ProjectCatId; label: Bilingual };

// CATS[0] is v3's own leading 'all' entry (the unfiltered pill) — kept so
// filter-pill UIs can map straight over this array without special-casing
// the first item.
export const PROJECT_CATS: ProjectCat[] = V3_CONTENT.cats.map(([id, en, ko]) => ({
  id: id as ProjectCat["id"],
  label: bi(en, ko),
}));

// Keyed to ProjectArt.tsx's hand-ported ART map (its entries are
// presentation, not content — see that file's header for why they aren't
// generated).
export type ArtKey = "cells" | "plate" | "grid" | "bubbles" | "translate" | "card" | "checklist" | "wave" | "layers";

export type Project = {
  id: string;
  cat: ProjectCatId;
  art: ArtKey;
  tag: Bilingual;
  title: Bilingual;
  desc: Bilingual;
  list: Bilingual[];
};

export const PROJECTS: Project[] = V3_CONTENT.projects.map((p) => ({
  id: p.id,
  cat: p.cat as ProjectCatId,
  art: p.art as ArtKey,
  tag: bi(p.tag[0], p.tag[1]),
  title: bi(p.title[0], p.title[1]),
  desc: bi(p.desc[0], p.desc[1]),
  list: p.list.map(([en, ko]) => bi(en, ko)),
}));

// A project's own category maps to one "home" service for cross-linking
// (the product/project detail pages' "Related" rail) — v3's `CAT_SVC`
// (site/index.html:3313). `lang` and `prod` both point at `intelligence`
// in the source; that isn't a typo, it's repeated verbatim.
export const CATEGORY_SERVICE: Record<ProjectCatId, ServiceId> = {
  health: "insight",
  edu: "creation",
  lang: "intelligence",
  prod: "intelligence",
};

// Which contact TOPICS id a project page's inquiry CTA preselects — v3's
// `CAT_TOPIC` (site/index.html:3597), verbatim (WOS-336).
export const CATEGORY_TOPIC: Record<ProjectCatId, string> = {
  health: "data",
  edu: "custom",
  lang: "ai",
  prod: "ai",
};

// ── Services ────────────────────────────────────────────────────────────
//
// SVC_ROWS (src/splice.py:651) authors these five rows in Python, not in
// the built HTML this ticket's extractor reads — so there is nothing to
// harvest automatically; transcribed here instead, replacing Band.tsx's
// private SERVICE_META (see that file) so Work's services panel and the
// product/project "Related" rails share one definition.

export type ServiceId = "intelligence" | "creation" | "insight" | "experience" | "evolution";

// Each svc-detail's "Related" rail — hand-authored per service directly in
// v3's markup (not a generated table, unlike SVC_ROWS itself), so it's
// transcribed here rather than harvested. `project`/`product` resolve
// against PROJECTS/PRODUCTS by id at render time; `static` is v3's own
// "고객사명 비공개" pattern — a named engagement whose client can't be
// disclosed, so it renders as inert text (`.rel-item.is-static`), not a
// link, with its own literal (non-dictionary) bilingual label.
// `abbr` on the project/product variants is the literal two-letter
// monogram the source hardcodes per entry (e.g. "YT" for YumTrack) — not
// computed, since a couple (like Skin Optics' "SO") don't follow a
// mechanical first-letters rule.
export type ServiceRelatedRef =
  | { kind: "project"; id: string; abbr: string }
  | { kind: "product"; id: ProductId; abbr: string }
  | { kind: "static"; abbr: string; label: Bilingual };

export type Service = {
  id: ServiceId;
  number: string; // '01'..'05', matches the source's own zero-padded numbering
  code: string; // 'INTELLIGENCE'..'EVOLUTION', the band's uppercase label
  name: Bilingual;
  // Abbreviation used by PRODUCT_PAGES' `rel[].ab` and CAT_SVC's cross-links.
  // Only AI/CS/DI ever appear in the v3 source's own cross-links (SkinArch/
  // BrainArch/WIZ never reference `experience` or `evolution`) — UX/MS
  // below are assigned for type completeness, not harvested from a source
  // reference.
  abbr: string;
  anchor: string; // the #svc-* id the Work services panel anchors to
  // Which contact TOPICS id this service's inquiry CTA preselects — v3's
  // own data-contact values on the five svc-detail cards (index.html:
  // 2455-2459), also the tuner's service→topic hand-off map (WOS-336).
  topic: string;
  weight?: number; // SpectrogramStack band weight; only `insight` deviates from 1
  // English-only technical-term chips shown under each svc-detail's body —
  // v3 never translates these (no bilingual span in the source markup).
  chips: string[];
  related: ServiceRelatedRef[];
  // Which dictionary caption the related rail uses — v3 picks this per
  // service by hand (svc-data's rail is captioned "관련 제품"/relatedProducts
  // even though one entry is a project), not by the entries' own kind.
  relatedCaption: "relatedLabel" | "relatedProducts";
};

export const SERVICES: Service[] = [
  {
    id: "intelligence",
    number: "01",
    code: "INTELLIGENCE",
    name: bi("AI & Intelligent Automation", "AI·지능형 자동화"),
    abbr: "AI",
    anchor: "svc-ai",
    topic: "ai",
    chips: ["Computer vision", "NLP / LLM", "Workflow AI"],
    related: [
      { kind: "project", id: "yumtrack", abbr: "YT" },
      { kind: "project", id: "kindleup", abbr: "KU" },
      { kind: "project", id: "audiomint", abbr: "AM" },
    ],
    relatedCaption: "relatedLabel",
  },
  {
    id: "creation",
    number: "02",
    code: "CREATION",
    name: bi("Custom Software Development", "맞춤 소프트웨어 개발"),
    abbr: "CS",
    anchor: "svc-custom",
    topic: "custom",
    chips: ["Web platforms", "SaaS", "Full-stack"],
    related: [
      { kind: "project", id: "ulms", abbr: "UE" },
      { kind: "project", id: "lingrid", abbr: "LG" },
      { kind: "project", id: "todont", abbr: "TD" },
    ],
    relatedCaption: "relatedLabel",
  },
  {
    id: "insight",
    number: "03",
    code: "INSIGHT",
    name: bi("Data & Imaging Intelligence", "데이터·이미징 인텔리전스"),
    abbr: "DI",
    anchor: "svc-data",
    topic: "data",
    weight: 1.1,
    chips: ["LC-OCT", "Segmentation", "3D reconstruction"],
    related: [
      { kind: "product", id: "skinarch", abbr: "SA" },
      { kind: "product", id: "brainarch", abbr: "BA" },
      { kind: "project", id: "skin", abbr: "SO" },
    ],
    relatedCaption: "relatedProducts",
  },
  {
    id: "experience",
    number: "04",
    code: "EXPERIENCE",
    name: bi("UI/UX & Product Design", "UI/UX·제품 디자인"),
    abbr: "UX",
    anchor: "svc-design",
    topic: "design",
    chips: ["Interface design", "Prototyping", "Design systems"],
    related: [
      { kind: "project", id: "pagoda", abbr: "PT" },
      { kind: "product", id: "wiz", abbr: "WZ" },
    ],
    relatedCaption: "relatedLabel",
  },
  {
    id: "evolution",
    number: "05",
    code: "EVOLUTION",
    name: bi("Modernization & Support", "현대화·운영 지원"),
    abbr: "MS",
    anchor: "svc-ops",
    topic: "support",
    chips: ["Legacy migration", "Integration", "Maintenance"],
    related: [
      { kind: "static", abbr: "LD", label: bi("Logistics dispatch", "물류 배차") },
      { kind: "static", abbr: "PP", label: bi("Print platform", "인쇄 플랫폼") },
    ],
    relatedCaption: "relatedLabel",
  },
];

// ── Products ────────────────────────────────────────────────────────────

export type ProductId = "skinarch" | "brainarch" | "wiz";

export type ProductFeature = { title: Bilingual; body: Bilingual };
export type ProductStep = { title: Bilingual; body: Bilingual };
export type ProductFact = { label: Bilingual; body: Bilingual };

// v3's `rel[]` mixes two reference shapes: a project (`k:'proj'`, carrying
// its own plain-string label — "Skin Optics" isn't translated either side
// in the source) and a service (`k:'svc'`, carrying a Bilingual label and
// the abbreviation that resolves against SERVICES).
export type ProductRel =
  | { kind: "project"; id: string; abbr: string; label: string }
  | { kind: "service"; abbr: string; label: Bilingual };

export type Product = {
  id: ProductId;
  name: string;
  cat: Bilingual;
  ruo: boolean;
  topic: string;
  lead: Bilingual;
  feats: ProductFeature[];
  steps: ProductStep[];
  whoH: Bilingual;
  who: Bilingual;
  facts: ProductFact[];
  note: Bilingual | null;
  rel: ProductRel[];
  // The Work → Products panel's short card teaser: English-only chips (v3
  // never translates these) and which price-line dictionary key applies.
  // Hand-authored directly in that panel's markup, not part of
  // PRODUCT_PAGES — see this file's header on that split.
  teaserChips: string[];
  priceKey: "priceAsk" | "monthly";
};

const TEASER: Record<ProductId, { chips: string[]; priceKey: Product["priceKey"] }> = {
  skinarch: { chips: ["LC-OCT", "3D skin analysis", "Quantification"], priceKey: "priceAsk" },
  wiz: { chips: ["Website embed", "Q&A", "Document requests"], priceKey: "monthly" },
  brainarch: { chips: ["CT imaging", "Visualization", "AI analysis"], priceKey: "priceAsk" },
};

function toRel(r: (typeof V3_CONTENT.productPages)[ProductId]["rel"][number]): ProductRel {
  if (r.k === "proj") {
    return { kind: "project", id: r.id, abbr: r.ab, label: r.t as string };
  }
  const t = r.t as readonly [string, string];
  return { kind: "service", abbr: r.ab, label: bi(t[0], t[1]) };
}

export const PRODUCTS: Record<ProductId, Product> = Object.fromEntries(
  (Object.keys(V3_CONTENT.productPages) as ProductId[]).map((id) => {
    const p = V3_CONTENT.productPages[id];
    return [
      id,
      {
        id,
        name: p.name,
        cat: bi(p.cat[0], p.cat[1]),
        ruo: p.ruo,
        topic: p.topic,
        lead: bi(p.lead[0], p.lead[1]),
        feats: p.feats.map(([enT, koT, enB, koB]) => ({ title: bi(enT, koT), body: bi(enB, koB) })),
        steps: p.steps.map(([enT, koT, enB, koB]) => ({ title: bi(enT, koT), body: bi(enB, koB) })),
        whoH: bi(p.whoH[0], p.whoH[1]),
        who: bi(p.who[0], p.who[1]),
        facts: p.facts.map(([enL, koL, enB, koB]) => ({ label: bi(enL, koL), body: bi(enB, koB) })),
        note: p.note ? bi(p.note[0], p.note[1]) : null,
        rel: p.rel.map(toRel),
        teaserChips: TEASER[id].chips,
        priceKey: TEASER[id].priceKey,
      },
    ];
  }),
) as Record<ProductId, Product>;

export const PRODUCT_ORDER: ProductId[] = ["skinarch", "wiz", "brainarch"];

// ── FAQ ─────────────────────────────────────────────────────────────────
//
// v3 has 8 Q/A pairs (`spFaqQ1-8`/`spFaqA1-8`, harvested by WOS-331's
// dictionary extractor); Home shows the first 4 (Faq.tsx keeps doing that,
// unchanged, straight off `siteT(locale).faq`) and the full set backs a
// future full FAQ view and the WOS-333 faq collection. Sourced straight
// from the raw generated dictionary rather than a per-locale `siteT()`
// call, since this array — like everything else in this file — is
// locale-agnostic.

export type FaqItem = { q: Bilingual; a: Bilingual };

const faqKo = V3_STRINGS.ko.faq;
const faqEn = V3_STRINGS.en.faq;

export const FAQ: FaqItem[] = [
  { q: bi(faqEn.q1, faqKo.q1), a: bi(faqEn.a1, faqKo.a1) },
  { q: bi(faqEn.q2, faqKo.q2), a: bi(faqEn.a2, faqKo.a2) },
  { q: bi(faqEn.q3, faqKo.q3), a: bi(faqEn.a3, faqKo.a3) },
  { q: bi(faqEn.q4, faqKo.q4), a: bi(faqEn.a4, faqKo.a4) },
  { q: bi(faqEn.q5, faqKo.q5), a: bi(faqEn.a5, faqKo.a5) },
  { q: bi(faqEn.q6, faqKo.q6), a: bi(faqEn.a6, faqKo.a6) },
  { q: bi(faqEn.q7, faqKo.q7), a: bi(faqEn.a7, faqKo.a7) },
  { q: bi(faqEn.q8, faqKo.q8), a: bi(faqEn.a8, faqKo.a8) },
];

// ── Insights ────────────────────────────────────────────────────────────
//
// Unlike every domain above, Insights' 5 items have no single source: publish
// metadata (date, kind, optional outbound/internal link) used to be
// hand-authored directly in NewsList.tsx — not part of any generated table —
// while the heading/body text went through WOS-331's dictionary harvest
// (`insights.n1h..n5p`). Joined here by array index, the same way FAQ above
// joins the raw dictionary's two halves, so this is one locale-agnostic
// source for WOS-333's `insights` collection to seed from, and NewsList.tsx
// no longer needs its own private array.

export type InsightKind = "news" | "product" | "case";
export type InsightLink = { href: string; external?: boolean; labelKey?: "segProducts" };

export type InsightItem = {
  id: string;
  date: string; // v3's own display string ("2026 · 03", "2023") — not a parseable date
  kind: InsightKind;
  link?: InsightLink;
  heading: Bilingual;
  body: Bilingual;
};

const insKo = V3_STRINGS.ko.insights;
const insEn = V3_STRINGS.en.insights;

export const INSIGHTS: InsightItem[] = [
  {
    id: "ins-1",
    date: "2026 · 03",
    kind: "news",
    link: { href: "https://www.scienceexchange.com", external: true },
    heading: bi(insEn.n1h, insKo.n1h),
    body: bi(insEn.n1p, insKo.n1p),
  },
  {
    id: "ins-2",
    date: "2026 · 01",
    kind: "news",
    heading: bi(insEn.n2h, insKo.n2h),
    body: bi(insEn.n2p, insKo.n2p),
  },
  {
    id: "ins-3",
    date: "2026",
    kind: "news",
    heading: bi(insEn.n3h, insKo.n3h),
    body: bi(insEn.n3p, insKo.n3p),
  },
  {
    id: "ins-4",
    date: "2026 · 08",
    kind: "product",
    link: { href: "/work/products", labelKey: "segProducts" },
    heading: bi(insEn.n4h, insKo.n4h),
    body: bi(insEn.n4p, insKo.n4p),
  },
  {
    id: "ins-5",
    date: "2023",
    kind: "case",
    heading: bi(insEn.n5h, insKo.n5h),
    body: bi(insEn.n5p, insKo.n5p),
  },
];

// ── Contact topics ──────────────────────────────────────────────────────
//
// v3's `TOPICS` (site/index.html:3218) — the /contact form's topic
// <select> options (WOS-334). Single source of truth for the form's
// options, the Inquiries collection's `topic` select field options, and
// the contact route handler's server-side topic validation — none of
// those should retype this list.

export type Topic = { id: string; label: Bilingual };

export const TOPICS: Topic[] = V3_CONTENT.topics.map(([id, ko, en]) => ({
  id,
  label: bi(en, ko),
}));

// ── Chip glossary (WOS-336) ─────────────────────────────────────────────
//
// v3's `CHIP_TIPS` (site/index.html:3688) — the 23 technical-term
// definitions behind every `.chip[data-tip]` tooltip, and the search
// index's `kind: "term"` glossary entries. The term itself is the chip's
// visible English text (v3 never translates the terms, only the
// definitions), so it doubles as the lookup key.

export type ChipTip = { term: string; tip: Bilingual };

export const CHIP_TIPS: ChipTip[] = Object.entries(V3_CONTENT.chipTips).map(([term, [en, ko]]) => ({
  term,
  tip: bi(en, ko),
}));

// ── Company reading log (WOS-336) ───────────────────────────────────────
//
// The sp-rail's 27 entries. Structure (ids, types, fractional-year rail
// positions, dates, the p24 break-line figures) comes from the generated
// V3_CONTENT.rail rows; each row's text arrives as v3 `data-i` key names
// ("spRailTeamH") that join onto the `rail` dictionary namespace
// (scripts/v3-rail-manifest.mjs keeps the same suffixes) — resolved here
// into the Bilingual shape everything else in this file uses.

export type RailEntryType = "milestone" | "service" | "product" | "project" | "proof";

export type RailEntry = {
  id: string;
  type: RailEntryType;
  t: number; // fractional year, the entry's position on the rail axis
  total?: number; // the confirmed client-project total the p24 proof entry carries
  datetime: string; // <time datetime> value ("2026-09", "2026")
  dateLabel: string; // the displayed date ("2026-09", "c. 2026")
  circa: boolean;
  title: Bilingual;
  meta?: Bilingual;
  para: Bilingual;
  enote?: Bilingual;
  enoteRuo?: boolean;
  breakLine?: { named: number; undisclosed: number };
  link?: { href: string; label: string };
};

type RawRailEntry = {
  id: string;
  type: string;
  t: number;
  total?: number;
  datetime: string;
  dateLabel: string;
  circa: boolean;
  titleKey: string;
  metaKey?: string;
  paraKey: string;
  enoteKey?: string;
  enoteRuo?: boolean;
  breakLine?: { named: number; undisclosed: number };
  link?: { href: string; label: string };
};

const railKo = V3_STRINGS.ko.rail as Record<string, string>;
const railEn = V3_STRINGS.en.rail as Record<string, string>;

function railStr(v3Key: string): Bilingual {
  const suffix = v3Key.replace(/^spRail/, "");
  const field = suffix[0].toLowerCase() + suffix.slice(1);
  const ko = railKo[field];
  const en = railEn[field];
  if (ko === undefined || en === undefined) {
    throw new Error(
      `Rail entry references "${v3Key}" but rail.${field} isn't in the generated dictionary — ` +
        `add it to scripts/v3-rail-manifest.mjs and regenerate.`,
    );
  }
  return { ko, en };
}

export const RAIL_ENTRIES: RailEntry[] = (V3_CONTENT.rail as readonly RawRailEntry[]).map((r) => ({
  id: r.id,
  type: r.type as RailEntryType,
  t: r.t,
  ...(r.total !== undefined ? { total: r.total } : {}),
  datetime: r.datetime,
  dateLabel: r.dateLabel,
  circa: r.circa,
  title: railStr(r.titleKey),
  ...(r.metaKey ? { meta: railStr(r.metaKey) } : {}),
  para: railStr(r.paraKey),
  ...(r.enoteKey ? { enote: railStr(r.enoteKey), enoteRuo: Boolean(r.enoteRuo) } : {}),
  ...(r.breakLine ? { breakLine: r.breakLine } : {}),
  ...(r.link ? { link: r.link } : {}),
}));
