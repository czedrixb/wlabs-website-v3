// WOS-331: which v3 dictionary keys the ported chrome + Home components
// actually render. This is the *only* place scope is declared — the
// extractor fails loudly on anything listed here that isn't harvestable
// from the v3 source (see extract-v3-dictionary.mjs), so an entry can't
// silently drift out of sync with the source.
//
// `type: "attr"` keys were carried by a `data-i-attr="attr:key"` element in
// the v3 markup (aria-labels, one placeholder) rather than by `data-i` on
// the element's own text content.
//
// Sibling sub-tasks (WOS-332 story/timeline/news/contact content, WOS-333
// Payload collections, WOS-334 backend + full Work/Company/Contact pages)
// each own their own slice of the v3 dictionary and should add their own
// manifest file alongside this one rather than growing this list — see
// AGENTS.md's note on this branch's port-in-slices convention.
export const MANIFEST = {
  chrome: {
    skip: { v3Key: "skip" },
    navMain: { v3Key: "navMain", type: "attr" },
    workSeg: { v3Key: "workSeg", type: "attr" },
    coSeg: { v3Key: "coSeg", type: "attr" },
    sitemapLabel: { v3Key: "sitemap", type: "attr" },
    langGroup: { v3Key: "langGroup", type: "attr" },
    tabHome: { v3Key: "tabHome" },
    tabWork: { v3Key: "tabWork" },
    tabCompany: { v3Key: "tabCompany" },
    tabSearch: { v3Key: "tabSearch" },
    tabContact: { v3Key: "tabContact" },
    tabContactShort: { v3Key: "tabContactShort" },
    segServices: { v3Key: "segServices" },
    subServices: { v3Key: "subServices" },
    segProducts: { v3Key: "segProducts" },
    subProducts: { v3Key: "subProducts" },
    segCases: { v3Key: "segCases" },
    subCases: { v3Key: "subCases" },
    story: { v3Key: "story" },
    subStory: { v3Key: "subStory" },
    team: { v3Key: "team" },
    subTeam: { v3Key: "subTeam" },
    insights: { v3Key: "insights" },
    subInsights: { v3Key: "subInsights" },
    ctaDiscuss: { v3Key: "ctaDiscuss" },
    partner: { v3Key: "partner" },
    legalHead: { v3Key: "legalHead" },
    privacy: { v3Key: "privacy" },
    terms: { v3Key: "terms" },
    legal1: { v3Key: "legal1" },
    legalAddr: { v3Key: "legalAddr" },
    legal2: { v3Key: "legal2" },
  },
  home: {
    ch1e: { v3Key: "ch1e" },
    ch2e: { v3Key: "ch2e" },
    ch3e: { v3Key: "ch3e" },
    heroLead: { v3Key: "heroLead" },
    ch2p: { v3Key: "ch2p" },
    ch3p: { v3Key: "ch3p" },
    sc1: { v3Key: "sc1" },
    sc2: { v3Key: "sc2" },
    sc3: { v3Key: "sc3" },
    dpL1: { v3Key: "dpL1" },
    dpL2: { v3Key: "dpL2" },
    dpL3: { v3Key: "dpL3" },
    dpL4: { v3Key: "dpL4" },
    dpCap: { v3Key: "dpCap" },
    heroCap: { v3Key: "heroCap" },
    scrollHint: { v3Key: "scrollHint" },
    ctaWork: { v3Key: "ctaWork" },
    scenesAriaLabel: { v3Key: "scenes", type: "attr" },
    snippetsAriaLabel: { v3Key: "snippets", type: "attr" },
    // Markup-bearing headings: harvested as raw HTML ("lead,<br><span
    // class=\"accent\">accent</span>tail"), not plain text. dictionary.ts
    // splits these into a { lead, accent, tail } triple at build time —
    // see its HEADING_RE.
    heroH1: { v3Key: "heroH1", type: "html" },
    ch2h: { v3Key: "ch2h", type: "html" },
    ch3h: { v3Key: "ch3h", type: "html" },
  },
  proof: {
    eyebrow: { v3Key: "proofEyebrow" },
    stat1: { v3Key: "proof1" },
    // Template — dictionary.ts splits this on "{year}" so each language
    // can put the animated counter wherever its own word order needs it
    // (see the ProofBand counter-fragment fix, plan Step 5).
    stat2Template: { v3Key: "proof2", template: "{year}" },
    stat3: { v3Key: "proof3" },
    stat3Badge: { v3Key: "proof3b" },
    stat4: { v3Key: "proof4" },
    stat4Badge: { v3Key: "proof4b" },
    note: { v3Key: "proofNote" },
  },
  band: {
    heading: { v3Key: "svcH2" },
    lead: { v3Key: "svcLead" },
    // v3's own service copy: SVC1-5 is used for both the accordion teaser
    // and the expanded answer, per the source and per Band.tsx's current
    // (duplicated) SERVICE_COPY — one key each, not two.
    svc1: { v3Key: "svc1" },
    svc2: { v3Key: "svc2" },
    svc3: { v3Key: "svc3" },
    svc4: { v3Key: "svc4" },
    svc5: { v3Key: "svc5" },
    svcName1: { v3Key: "spTunerSvcNm1" },
    svcName2: { v3Key: "spTunerSvcNm2" },
    svcName3: { v3Key: "spTunerSvcNm3" },
    svcName4: { v3Key: "spTunerSvcNm4" },
    svcName5: { v3Key: "spTunerSvcNm5" },
    ctaOpen: { v3Key: "spSvcOpen" },
    ctaFind: { v3Key: "spCtaFind" },
    ctaSeeAll: { v3Key: "spCtaServices" },
  },
  faq: {
    title: { v3Key: "spFaqTitle" },
    ask: { v3Key: "spFaqAsk" },
    q1: { v3Key: "spFaqQ1" },
    a1: { v3Key: "spFaqA1" },
    q2: { v3Key: "spFaqQ2" },
    a2: { v3Key: "spFaqA2" },
    q3: { v3Key: "spFaqQ3" },
    a3: { v3Key: "spFaqA3" },
    note3: { v3Key: "spFaqA3b" },
    q4: { v3Key: "spFaqQ4" },
    a4: { v3Key: "spFaqA4" },
    ctaProjects: { v3Key: "spCtaProjects" },
    ctaProducts: { v3Key: "spCtaProducts" },
    ctaHistory: { v3Key: "spCtaHistory" },
  },
};
