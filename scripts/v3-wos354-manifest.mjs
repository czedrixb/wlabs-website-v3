// WOS-354: the Privacy/Terms legal pages' chrome strings — the breadcrumb,
// the switch-to-sibling-document link, the effective-date label, and the
// SegNav aria-label. Merged into the single generated dictionary by
// extract-v3-dictionary.mjs alongside WOS-331's MANIFEST; see that file for
// the manifest shape and extraction rules.
//
// All inline literals: v3's renderLegal() (site/index.html:4088-4103)
// builds the breadcrumb/switch/effective-date strings directly in template
// strings rather than through `data-i` markup, so there is no v3Key to
// harvest — both sides are transcribed verbatim from the source. v3 also
// carries a "Korean text prevails" courtesy-translation notice here; dropped
// for this port rather than ported or replaced (per request), so there is
// no manifest entry for it. `legalSeg` has no v3 equivalent either — v3's
// legal screens aren't reachable from a top nav, so nothing there needed an
// aria-label for a tablist — authored fresh, matching the house style of
// chrome.coSeg/workSeg.
export const WOS354_MANIFEST = {
  legal: {
    effective: {
      ko: "시행일자",
      en: "Effective date",
    },
    switchCta: {
      // v3's cross-link is just the sibling document's own title + arrow —
      // `${bi(LEGAL[other].t[0],LEGAL[other].t[1])} →` — no extra wording,
      // so this template doesn't add any either.
      ko: "{doc} →",
      en: "{doc} →",
    },
    legalSeg: {
      ko: "법적 고지 하위 메뉴",
      en: "Legal sections",
    },
  },
};
