// WOS-332: the v3 dictionary keys the Work/Company panels, the product and
// project detail pages, and Home's project-strip/company-teaser need — the
// slice scripts/v3-dictionary-manifest.mjs's own header reserved for this
// sub-task rather than growing that file. Merged into the single generated
// dictionary by scripts/extract-v3-dictionary.mjs alongside WOS-331's
// MANIFEST; see that file for the manifest shape and extraction rules.
//
// Not included: `spRail*` (~30 keys, the Company → Story "reading log"
// timeline, `src/mods/mod-rail.html`). That module is a ~690-line
// interactive SVG scrubber ported from nothing yet, and is out of scope
// for this pass — see the WOS-332 plan's M5 note. `/company/story` ships
// with its prose, five-entry timeline, values and partnership CTA; the
// rail is a follow-up.
export const CONTENT_MANIFEST = {
  home: {
    // Home's project strip (#home-projects)
    projEyebrow: { v3Key: "projEyebrow" },
    projH2: { v3Key: "projH2" },
    projLead: { v3Key: "projLead" },
    filterLabel: { v3Key: "filterLabel", type: "attr" },
    seeAllProjects: { v3Key: "seeAllProjects" },
    // Home's company teaser
    coEyebrow: { v3Key: "coEyebrow" },
    coH2: { v3Key: "coH2" },
    coLead: { v3Key: "coLead" },
    aboutLink: { v3Key: "aboutLink" },
  },
  work: {
    workH1: { v3Key: "workH1" },
    workLead: { v3Key: "workLead" },
    // services panel — one lead paragraph per SERVICES entry, keyed d1..d5
    d1: { v3Key: "d1" },
    d2: { v3Key: "d2" },
    d3: { v3Key: "d3" },
    d4: { v3Key: "d4" },
    d5: { v3Key: "d5" },
    // products panel — v3's own three-card teaser copy (the product pages
    // themselves carry their own `lead` in PRODUCT_PAGES; this is the
    // shorter card-list blurb, pp1..pp3 in source order skinarch/wiz/brainarch)
    pp1: { v3Key: "pp1" },
    pp2: { v3Key: "pp2" },
    pp3: { v3Key: "pp3" },
    priceAsk: { v3Key: "priceAsk" },
    monthly: { v3Key: "monthly" },
    productPage: { v3Key: "productPage" },
    ruoNote: { v3Key: "ruoNote" },
    // cases panel
    projNote: { v3Key: "projNote" },
    // services panel — each svc-detail's "Related" rail caption
    relatedLabel: { v3Key: "relatedLabel" },
    relatedProducts: { v3Key: "relatedProducts" },
    relatedOpsNote: { v3Key: "relatedOpsNote" },
  },
  company: {
    coH1: { v3Key: "coH1" },
    coLead2: { v3Key: "coLead2" },
    // team panel
    teamLead: { v3Key: "teamLead" },
    teamNote: { v3Key: "teamNote" },
    // story panel
    storyEyebrow: { v3Key: "storyEyebrow" },
    storyH2: { v3Key: "storyH2" },
    storyLead: { v3Key: "storyLead" },
    tl1h: { v3Key: "tl1h" },
    tl1p: { v3Key: "tl1p" },
    tl2h: { v3Key: "tl2h" },
    tl2p: { v3Key: "tl2p" },
    tl3h: { v3Key: "tl3h" },
    tl3p: { v3Key: "tl3p" },
    tl4h: { v3Key: "tl4h" },
    tl4p: { v3Key: "tl4p" },
    tl5h: { v3Key: "tl5h" },
    tl5p: { v3Key: "tl5p" },
    v1h: { v3Key: "v1h" },
    v1p: { v3Key: "v1p" },
    v2h: { v3Key: "v2h" },
    v2p: { v3Key: "v2p" },
    v3h: { v3Key: "v3h" },
    v3p: { v3Key: "v3p" },
    v4h: { v3Key: "v4h" },
    v4p: { v3Key: "v4p" },
    partnerH2: { v3Key: "partnerH2" },
    partnerCta: { v3Key: "partnerCta" },
  },
  // WOS-342: the listing's chrome only. v3's Insights rebuild (its commit
  // 2021e81) replaced the old news/product/case taxonomy with news/notes/
  // research — `insProduct`/`insCase` no longer exist as data-i keys in the
  // source, so they're gone from here too (the extractor fails loudly on
  // missing keys). The per-card copy (n1h..n6p) still exists in the source
  // but now lives with the rest of each article's content in
  // src/lib/site/insightArticles.ts — one article, one source — so those
  // keys aren't harvested anymore either.
  insights: {
    insH2: { v3Key: "insH2" },
    insLead: { v3Key: "insLead" },
    insFilter: { v3Key: "insFilter", type: "attr" },
    insAll: { v3Key: "insAll" },
    insNews: { v3Key: "insNews" },
    insNotes: { v3Key: "insNotes" },
    insResearch: { v3Key: "insResearch" },
    insRead: { v3Key: "insRead" },
    insPages: { v3Key: "insPages", type: "attr" },
    insNote: { v3Key: "insNote" },
  },
  // Extends WOS-331's `faq` namespace (Home shows q1-q4; the full 8-item
  // set backs the WOS-333 faq collection and a future full FAQ view).
  faq: {
    q5: { v3Key: "spFaqQ5" },
    a5: { v3Key: "spFaqA5" },
    q6: { v3Key: "spFaqQ6" },
    a6: { v3Key: "spFaqA6" },
    q7: { v3Key: "spFaqQ7" },
    a7: { v3Key: "spFaqA7" },
    q8: { v3Key: "spFaqQ8" },
    a8: { v3Key: "spFaqA8" },
    // `spFaqAll` ("All questions") exists in the v3 EN object but — like
    // `spRailUndisclosed` (see extract-v3-dictionary.mjs's header) — has no
    // `data-i="spFaqAll"` element anywhere in the markup, so there's no
    // Korean side to harvest. Nothing in this ticket's scope needs it.
  },
};
