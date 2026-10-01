// WOS-336: the v3 dictionary keys the sp-rail company "reading log" needs
// (site/index.html:2526-2616 markup + the MOD:rail script at :4485-4839) —
// the slice WOS-332's manifest header explicitly reserved for a follow-up.
// Merged into the single generated dictionary by extract-v3-dictionary.mjs;
// see that file for the manifest shape and extraction rules.
//
// Field names keep the v3 key's own suffix (teamH ↔ spRailTeamH) so the
// per-entry text can be joined back onto the structural rows
// extract-v3-content.mjs harvests from the 27 `li.sp-rail-entry` elements
// (V3_CONTENT.rail) by stripping the `spRail` prefix — no hand-maintained
// key mapping. src/lib/site/content.ts does that join.
//
// `undisclosed` is the one key in the whole v3 source with no EN value
// (the gap extract-v3-dictionary.mjs's fail-loud guard was written for —
// its EN page falls back to showing the Korean). Rather than inherit that
// bug, the English here is an inline literal authored for this port; the
// Korean is the harvested markup string, verbatim (index.html:2592).
export const RAIL_MANIFEST = {
  rail: {
    // scrubber band chrome
    reading: { v3Key: "spRailReading" },
    span: { v3Key: "spRailSpan" },
    todayNote: { v3Key: "spRailTodayNote" },
    region: { v3Key: "spRailRegion", type: "attr" },
    axisLabel: { v3Key: "spRailAxisLabel", type: "attr" },
    // filter pills
    filterLabel: { v3Key: "spRailFilterLabel", type: "attr" },
    fAll: { v3Key: "spRailFAll" },
    fCompany: { v3Key: "spRailFCompany" },
    fServices: { v3Key: "spRailFServices" },
    fProducts: { v3Key: "spRailFProducts" },
    fProjects: { v3Key: "spRailFProjects" },
    fProof: { v3Key: "spRailFProof" },
    // honest-counter tiles
    cntProjectsE: { v3Key: "spRailCntProjectsE" },
    cntProjectsS: { v3Key: "spRailCntProjectsS" },
    cntYearE: { v3Key: "spRailCntYearE" },
    cntYearS: { v3Key: "spRailCntYearS" },
    // dating-rule aside
    ruleH: { v3Key: "spRailRuleH" },
    rule1: { v3Key: "spRailRule1" },
    rule2: { v3Key: "spRailRule2" },
    rule3: { v3Key: "spRailRule3" },
    // log chrome + entry-type chips
    logLabel: { v3Key: "spRailLogLabel", type: "attr" },
    chipMilestone: { v3Key: "spRailChipMilestone" },
    chipService: { v3Key: "spRailChipService" },
    chipProduct: { v3Key: "spRailChipProduct" },
    chipProject: { v3Key: "spRailChipProject" },
    chipProof: { v3Key: "spRailChipProof" },
    // shared entry notes
    asOfLog: { v3Key: "spRailAsOfLog" },
    imgMeta: { v3Key: "spRailImgMeta" },
    ruo: { v3Key: "spRailRuo" },
    noMonth: { v3Key: "spRailNoMonth" },
    namedOnLog: { v3Key: "spRailNamedOnLog" },
    undisclosedShort: { v3Key: "spRailUndisclosedShort" },
    undisclosed: {
      ko: "비공개 = 이름 공개에 서면 동의하지 않은 고객사.",
      en: "Undisclosed = clients who did not give written consent to be named.",
    },
    // JS-composed strings (the module's TXT table, index.html:4532-4543) —
    // the axis' drawn "Today" label and the role=status count line.
    // `{n}` is a literal marker StoryRail replaces, same convention as the
    // search namespace's metaCount.
    todayLabel: { ko: "오늘 2026-09", en: "Today 2026-09" },
    status: { ko: "{n}개 항목 표시 · 최신순", en: "{n} entries shown · newest first" },
    // the 27 entries, newest → oldest (titles H, paragraphs P, notes N)
    teamH: { v3Key: "spRailTeamH" },
    teamP: { v3Key: "spRailTeamP" },
    brainH: { v3Key: "spRailBrainH" },
    brainP: { v3Key: "spRailBrainP" },
    skinH: { v3Key: "spRailSkinH" },
    skinP: { v3Key: "spRailSkinP" },
    plineH: { v3Key: "spRailPlineH" },
    plineP: { v3Key: "spRailPlineP" },
    p24H: { v3Key: "spRailP24H" },
    p24P: { v3Key: "spRailP24P" },
    wizH: { v3Key: "spRailWizH" },
    wizMeta: { v3Key: "spRailWizMeta" },
    wizP: { v3Key: "spRailWizP" },
    wizN: { v3Key: "spRailWizN" },
    dunsH: { v3Key: "spRailDunsH" },
    dunsP: { v3Key: "spRailDunsP" },
    seH: { v3Key: "spRailSeH" },
    seP: { v3Key: "spRailSeP" },
    vendorH: { v3Key: "spRailVendorH" },
    vendorP: { v3Key: "spRailVendorP" },
    m2026H: { v3Key: "spRailM2026H" },
    m2026P: { v3Key: "spRailM2026P" },
    svc5H: { v3Key: "spRailSvc5H" },
    svc5P: { v3Key: "spRailSvc5P" },
    m2025H: { v3Key: "spRailM2025H" },
    m2025P: { v3Key: "spRailM2025P" },
    audioH: { v3Key: "spRailAudioH" },
    audioP: { v3Key: "spRailAudioP" },
    todontH: { v3Key: "spRailTodontH" },
    todontP: { v3Key: "spRailTodontP" },
    kindleH: { v3Key: "spRailKindleH" },
    kindleP: { v3Key: "spRailKindleP" },
    lingridH: { v3Key: "spRailLingridH" },
    lingridP: { v3Key: "spRailLingridP" },
    yumH: { v3Key: "spRailYumH" },
    yumP: { v3Key: "spRailYumP" },
    svc4H: { v3Key: "spRailSvc4H" },
    svc4P: { v3Key: "spRailSvc4P" },
    svc1H: { v3Key: "spRailSvc1H" },
    svc1P: { v3Key: "spRailSvc1P" },
    m2024H: { v3Key: "spRailM2024H" },
    m2024P: { v3Key: "spRailM2024P" },
    opticsH: { v3Key: "spRailOpticsH" },
    opticsP: { v3Key: "spRailOpticsP" },
    opticsN: { v3Key: "spRailOpticsN" },
    pagodaH: { v3Key: "spRailPagodaH" },
    pagodaP: { v3Key: "spRailPagodaP" },
    ulmsH: { v3Key: "spRailUlmsH" },
    ulmsP: { v3Key: "spRailUlmsP" },
    svc2H: { v3Key: "spRailSvc2H" },
    svc2P: { v3Key: "spRailSvc2P" },
    m2023H: { v3Key: "spRailM2023H" },
    m2023P: { v3Key: "spRailM2023P" },
    svc3H: { v3Key: "spRailSvc3H" },
    svc3P: { v3Key: "spRailSvc3P" },
    m2022H: { v3Key: "spRailM2022H" },
    m2022P: { v3Key: "spRailM2022P" },
  },
};
