// WOS-342: the Insights single-page strings (article hero, share row,
// figure lightbox, prev/next, sources, 404) plus the listing's empty-state
// and pager strings — all introduced by v3's Insights rebuild (its commit
// 2021e81). None of these exist as data-i elements or EN-object keys: the
// v3 source renders every one from inline `bi('…','…')` / `lang==='en'?…:…`
// ternaries inside renderInsight/renderInsightMissing/applyInsights/
// shareRow (src/orig/wlabs-01-wired.html:1729-2032), so — same as
// v3-wos336-manifest.mjs's search states — both sides are transcribed
// verbatim as inline `{ ko, en }` literals, with `{cat}` a placeholder the
// component interpolates. Merged into the single generated dictionary by
// extract-v3-dictionary.mjs.
export const WOS342_MANIFEST = {
  insights: {
    // listing: empty-category state (:1999-2003)
    insEmptyTitle: { ko: "아직 {cat} 글이 없습니다", en: "No {cat} articles yet" },
    insEmptyBody: {
      ko: "확인된 내용만 게재하기 때문에 이 분류는 천천히 채워집니다. 지금까지 공개한 글은 전체에서 모두 보실 수 있습니다.",
      en: "We publish only what we can stand behind, so this category fills up slowly. Everything we have published so far is under All.",
    },
    insEmptyCta: { ko: "인사이트 전체 보기", en: "View all insights" },
    // listing: pager arrows (:2012)
    pagerPrev: { ko: "이전 페이지", en: "Previous page" },
    pagerNext: { ko: "다음 페이지", en: "Next page" },
    // article hero crumbs (:1903) — same strings as chrome's Company nav
    // label and the Insights eyebrow, but those chrome keys are harvested
    // with their own capitalisation/markup contexts; the crumb pair is
    // transcribed from renderInsight's own bi() calls.
    crumbCompany: { ko: "회사", en: "Company" },
    crumbInsights: { ko: "인사이트", en: "Insights" },
    // byline + share row (:1729-1744)
    writtenBy: { ko: "작성", en: "Written by" },
    share: { ko: "공유", en: "Share" },
    shareFb: { ko: "페이스북에 공유", en: "Share on Facebook" },
    shareLi: { ko: "링크드인에 공유", en: "Share on LinkedIn" },
    copyLink: { ko: "링크 복사", en: "Copy link" },
    // figure lightbox (:1750, :1935)
    expandImage: { ko: "이미지 확대", en: "Expand image" },
    lightboxClose: { ko: "닫기", en: "Close" },
    // sources block (:1916)
    sources: { ko: "출처", en: "Sources" },
    // prev/next (:1927, :1947-1949)
    insNavAria: { ko: "이전 및 다음 글", en: "Previous and next article" },
    prevNewer: { ko: "이전 · 최신", en: "Previous · newer" },
    nextOlder: { ko: "다음 · 이전 글", en: "Next · older" },
    nothingFurther: { ko: "더 이상 없습니다", en: "Nothing further" },
    // related rail (:1951) + the 404's variant (:1890)
    moreInsights: { ko: "다른 인사이트", en: "More insights" },
    latestInsights: { ko: "최신 인사이트", en: "Latest insights" },
    // 404 article (:1877-1889)
    nf404Title: { ko: "요청하신 글을 찾을 수 없습니다.", en: "This article isn’t here." },
    nf404Dek: {
      ko: "링크가 오래되었거나 글의 주소가 변경되었을 수 있습니다. 공개된 모든 글은 인사이트 페이지에 있습니다.",
      en: "The link may be out of date, or the article may have been renamed. Everything we have published is on the Insights page.",
    },
    nfRequested: { ko: "요청한 주소", en: "Requested" },
    nfAllInsights: { ko: "인사이트 전체", en: "All insights" },
    nfBackHome: { ko: "홈으로", en: "Back to home" },
  },
};
