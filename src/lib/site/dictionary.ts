import type { Locale } from "@/lib/locale";
import { V3_STRINGS } from "./dictionary.generated";
import { V3_CONTENT } from "./content.generated";

// The site chrome + Home dictionary — extends the STRINGS/t(locale) pattern
// already used for the blog (src/lib/strings.ts) with namespaces matching
// the components that consume them. Every value here must stay plain,
// JSON-serializable data (no functions): nine of the components that read
// this are 'use client' (Header, Masthead, TabBar, LangToggle, Hero,
// ProofBand, Faq, Field, SpectrogramStack), so whatever this returns has to
// cross the server/client boundary as a prop.
//
// Source strings live in dictionary.generated.ts, harvested from the v3
// design repo by scripts/extract-v3-dictionary.mjs against two manifests —
// scripts/v3-dictionary-manifest.mjs (WOS-331: chrome + Home's hero/proof/
// band/faq) and scripts/v3-content-manifest.mjs (WOS-332: Work/Company
// panels, product/project detail pages, Home's project-strip/company-
// teaser). This file composes those raw pairs into the shapes components
// actually use — parsing the two markup-bearing headings, building the
// proof-band counter template, and cross-referencing a couple of strings
// that repeat verbatim elsewhere in v3 (Band's "서비스" eyebrow is the same
// string as the nav's segServices; Faq's two CTAs reuse Band's) rather than
// harvesting duplicate keys for them.

type Heading = { lead: string; accent: string; tail: string };

// heroH1/ch2h/ch3h are the only three v3 strings that carry markup — a
// <br> plus a <span class="accent"> sitting mid-sentence in both languages
// (see dictionary.generated.ts). Splitting them into a 3-slot shape here
// means the components that render them never need
// dangerouslySetInnerHTML.
// No `s` (dotAll) flag: every heading is one line in the source, and the
// project's ES2017 target doesn't allow that flag's syntax anyway.
const HEADING_RE = /^(.*?)<br>\s*<span class="accent">(.*?)<\/span>(.*)$/;

function parseHeading(html: string): Heading {
  const m = HEADING_RE.exec(html);
  if (!m) {
    throw new Error(`Dictionary heading isn't in the expected lead/<br>/accent/tail shape: "${html}"`);
  }
  const [, lead, accent, tail] = m;
  // tail is intentionally NOT trimmed — English's tail starts with the
  // space "then choose" needs before " the technology.".
  return { lead: lead.trim(), accent: accent.trim(), tail };
}

type RcNote = { lead: string; privacy: string; mid: string; terms: string; tail: string };

// contact.rcNote (WOS-334) is the fourth markup-bearing v3 string — two
// <a href="https://policies.google.com/..."> links sitting mid-sentence in
// both languages. Same reasoning as parseHeading above: split into a
// 5-slot shape so ContactForm.tsx renders real <a> elements instead of
// reaching for dangerouslySetInnerHTML. The two hrefs are fixed in the v3
// source, so they aren't part of the parsed shape.
const RC_NOTE_RE =
  /^(.*?)<a href="https:\/\/policies\.google\.com\/privacy"[^>]*>(.*?)<\/a>(.*?)<a href="https:\/\/policies\.google\.com\/terms"[^>]*>(.*?)<\/a>(.*)$/;

function parseRcNote(html: string): RcNote {
  const m = RC_NOTE_RE.exec(html);
  if (!m) {
    throw new Error(`Dictionary rcNote isn't in the expected lead/privacy-link/mid/terms-link/tail shape: "${html}"`);
  }
  const [, lead, privacy, mid, terms, tail] = m;
  return { lead, privacy, mid, terms, tail };
}

// v3 leaves a few strings untranslated by design (proof3b/proof4b's
// "Verified"/"Approved" render in English in the Korean page too — see
// dictionary.generated.ts — and ProofBand's animateRoll only scrambles
// ASCII, so this isn't incidental). These two aria-labels follow the same
// convention for symmetry (Hero.tsx's outer <div className="story">
// and the node-tips placeholder), but v3 never dictionary-ized them at all
// (no data-i on either element) — there's no source key to harvest, so
// they're literals here instead of coming from dictionary.generated.ts.
const STORY_ARIA_LABEL = "Intelligence in motion";

// WOS-335: the blog's nav/footer label. v3 has no blog, so — same as
// STORY_ARIA_LABEL above — there's no source key in dictionary.generated.ts
// to harvest; hand-authored here instead.
const BLOG_LABELS: Record<Locale, { tabBlog: string }> = {
  ko: { tabBlog: "블로그" },
  en: { tabBlog: "Blog" },
};

function build(locale: Locale) {
  const v3 = V3_STRINGS[locale];

  return {
    chrome: { ...v3.chrome, ...BLOG_LABELS[locale] },
    home: {
      ...v3.home,
      heading1: parseHeading(v3.home.heroH1),
      heading2: parseHeading(v3.home.ch2h),
      heading3: parseHeading(v3.home.ch3h),
      ctaDiscuss: v3.chrome.ctaDiscuss,
      storyAriaLabel: STORY_ARIA_LABEL,
      // Company teaser's second link ("회사 연혁 보기") is the same string as
      // Faq's ctaHistory CTA — reused rather than harvested twice, same
      // convention as band.eyebrow above.
      ctaHistory: v3.faq.ctaHistory,
      // WOS-336: Home's products preview reuses the Work products panel's
      // price/footer strings (v3 points both surfaces at the same
      // priceAsk/monthly/productPage keys) — cross-referenced, not
      // harvested twice.
      priceAsk: v3.work.priceAsk,
      monthly: v3.work.monthly,
      productPage: v3.work.productPage,
    },
    proof: {
      ...v3.proof,
      // ProofBand.tsx counter-fragment fix (plan Step 5): v3's own source
      // glues an animated <b>{year}</b> counter to a sentence fragment in
      // DOM order, which only reads correctly in Korean word order — the
      // EN fragment ("Delivering client work continuously since") needs
      // the year AFTER it, not before. "{year}" is a literal marker
      // ProofBand.tsx splits on to place the animated counter in the right
      // spot for each language, not real interpolation.
      stat2: locale === "en" ? `${v3.proof.stat2Template} {year}` : `{year}${v3.proof.stat2Template}`,
    },
    band: {
      ...v3.band,
      // Same string as chrome.segServices ("서비스"/"Services") — Band's
      // eyebrow and its sr-only heading are that nav label reused, not a
      // separate translation.
      eyebrow: v3.chrome.segServices,
    },
    faq: {
      ...v3.faq,
      // Same CTA strings Band already carries ("다섯 가지 방식 보기 →" /
      // "필요한 것부터 찾아보기") — reused rather than harvested twice.
      ctaSeeAll: v3.band.ctaSeeAll,
      ctaFind: v3.band.ctaFind,
    },
    // WOS-332: Work/Company panels + product/project detail pages. Plain
    // passthroughs — no markup-bearing strings or cross-references in this
    // slice the way home/proof/band/faq have above.
    work: v3.work,
    company: v3.company,
    insights: v3.insights,
    // WOS-334: the /contact form. rcNote is the one markup-bearing string
    // in this slice — see parseRcNote above.
    contact: {
      ...v3.contact,
      rcNote: parseRcNote(v3.contact.rcNote),
    },
    // WOS-336: the sp-tuner resonance finder. Besides the flat per-card
    // copy, the dial options / short forms / first steps are exposed as
    // id-keyed records so SpTuner can look them up by the option ids its
    // data tables use (tunerData.ts) instead of string-assembling key names.
    tuner: {
      ...v3.tuner,
      optionLabels: {
        ai: v3.tuner.o_ai,
        software: v3.tuner.o_software,
        imaging: v3.tuner.o_imaging,
        interface: v3.tuner.o_interface,
        modernise: v3.tuner.o_modernise,
        idea: v3.tuner.o_idea,
        spec: v3.tuner.o_spec,
        prototype: v3.tuner.o_prototype,
        production: v3.tuner.o_production,
        exploring: v3.tuner.o_exploring,
        quarter: v3.tuner.o_quarter,
        urgent: v3.tuner.o_urgent,
      },
      optionShorts: {
        ai: v3.tuner.s_ai,
        software: v3.tuner.s_software,
        imaging: v3.tuner.s_imaging,
        interface: v3.tuner.s_interface,
        modernise: v3.tuner.s_modernise,
        idea: v3.tuner.s_idea,
        spec: v3.tuner.s_spec,
        prototype: v3.tuner.s_prototype,
        production: v3.tuner.s_production,
        exploring: v3.tuner.s_exploring,
        quarter: v3.tuner.s_quarter,
        urgent: v3.tuner.s_urgent,
      },
      steps: {
        define: v3.tuner.step_define,
        workshop: v3.tuner.step_workshop,
        prototype: v3.tuner.step_prototype,
        build: v3.tuner.step_build,
        review: v3.tuner.step_review,
        migration: v3.tuner.step_migration,
      },
    },
    // WOS-336: the company reading-log rail. Entry text is joined onto the
    // structural rows in content.ts (RAIL_ENTRIES); this slice carries the
    // rail's own chrome (scrubber, pills, counters, rule aside, chips).
    rail: v3.rail,
    // WOS-336: /search. The result-group labels come from v3's `KIND`
    // table (content.generated.ts), resolved per locale here so
    // SearchClient gets one flat strings slice.
    search: {
      ...v3.search,
      kinds: Object.fromEntries(
        Object.entries(V3_CONTENT.searchKinds).map(([kind, [en, ko]]) => [
          kind,
          locale === "en" ? en : ko,
        ]),
      ) as Record<keyof typeof V3_CONTENT.searchKinds, string>,
    },
    // WOS-336: the #sheet contact slide-over. Its form reuses the /contact
    // form's field labels, validation and status strings verbatim (v3's own
    // sheet markup points at the same fTopic/fEmail/errEmail/consent2/send
    // keys) — cross-referenced rather than harvested twice, same convention
    // as band.eyebrow above.
    sheet: {
      ...v3.sheet,
      fTopic: v3.contact.fTopic,
      fEmail: v3.contact.fEmail,
      errEmail: v3.contact.errEmail,
      errTopic: v3.contact.errTopic,
      consent2: v3.contact.consent2,
      send: v3.contact.send,
      sending: v3.contact.sending,
      sent: v3.contact.sent,
      failed: v3.contact.failed,
      invalid: v3.contact.invalid,
      needConsent: v3.contact.needConsent,
      toastOkT: v3.contact.toastOkT,
      toastOk: v3.contact.toastOk,
      toastInvalidT: v3.contact.toastInvalidT,
      toastFailT: v3.contact.toastFailT,
    },
  };
}

export type SiteStrings = ReturnType<typeof build>;

export const SITE_STRINGS: Record<Locale, SiteStrings> = {
  ko: build("ko"),
  en: build("en"),
};

export function siteT(locale: Locale): SiteStrings {
  return SITE_STRINGS[locale];
}
