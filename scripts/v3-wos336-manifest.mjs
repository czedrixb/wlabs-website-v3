// WOS-336: the remaining v3 dictionary keys this ticket's smaller surfaces
// need — the /search screen, the #sheet contact slide-over, Home's products
// preview + closing CTA panel, and the toast notifications. The two big
// interactive modules own their own manifests (v3-tuner-manifest.mjs,
// v3-rail-manifest.mjs). Merged into the single generated dictionary by
// extract-v3-dictionary.mjs; see that file for the manifest shape and
// extraction rules.
//
// The `{ ko, en }` inline-literal entries cover strings the v3 source only
// ever renders from inline JS ternaries (`L?'…':'…'` in the search render(),
// site/index.html:3673-3680) — there is no data-i element or EN-object key
// to harvest, so both sides are transcribed verbatim here, with `{q}`/`{n}`
// placeholders where the source interpolates. The toast titles/bodies ARE
// harvestable: their Korean lives in `KO.*` literal assignments (:3499)
// like WOS-334's form status strings.
export const WOS336_MANIFEST = {
  search: {
    searchH1: { v3Key: "searchH1" },
    placeholder: { v3Key: "searchPh", type: "attr" },
    suggested: { v3Key: "suggested" },
    inServices: { v3Key: "inServices" },
    inProducts: { v3Key: "inProducts" },
    inProjects: { v3Key: "inProjects" },
    interactiveCap: { v3Key: "interactiveCap" },
    hintMin: {
      ko: "두 글자 이상 입력해 주세요.",
      en: "Type at least two characters.",
    },
    emptyH: {
      ko: "“{q}”에 대한 결과가 없습니다.",
      en: "No matches for “{q}”.",
    },
    emptyP1: {
      ko: "철자를 확인하거나 더 짧은 키워드로 시도해 보세요. 제품명, 프로젝트명, 서비스, 팀원 이름으로 검색할 수 있습니다.",
      en: "Check the spelling or try a shorter keyword. You can search product and project names, services, team members and terms.",
    },
    emptyP2: {
      ko: "찾으시는 내용이 아직 사이트에 없을 수도 있습니다. 직접 물어보세요 — 하루 안에 답변드립니다.",
      en: "What you are looking for may not be on the site yet. Ask us directly — we reply within a business day.",
    },
    ctaAsk: { ko: "직접 문의하기", en: "Ask us instead" },
    ctaBrowse: { ko: "하는 일 둘러보기", en: "Browse our work" },
    metaCount: { ko: "{n} 개 결과", en: "{n} results" },
    metaCountOne: { ko: "{n} 개 결과", en: "{n} result" },
    metaEnter: { ko: "Enter로 첫 결과 열기", en: "Enter opens the first result" },
  },
  sheet: {
    eyebrow: { v3Key: "sheetEyebrow" },
    h2: { v3Key: "sheetH2" },
    close: { v3Key: "close", type: "attr" },
    fMsgShort: { v3Key: "fMsgShort" },
    consentShort: { v3Key: "consentShort" },
  },
  home: {
    // products 3-card preview (index.html:2313-2342)
    prodEyebrow: { v3Key: "prodEyebrow" },
    prodH2: { v3Key: "prodH2" },
    prodLead: { v3Key: "prodLead" },
    p1: { v3Key: "p1" },
    p2: { v3Key: "p2" },
    p3: { v3Key: "p3" },
    // closing CTA panel (index.html:2424-2435); ctaDiscuss is already
    // harvested in the chrome namespace — dictionary.ts cross-references it.
    ctaEyebrow: { v3Key: "ctaEyebrow" },
    ctaH2: { v3Key: "ctaH2" },
    ctaNews: { v3Key: "ctaNews" },
  },
  contact: {
    toastOkT: { v3Key: "toastOkT" },
    toastOk: { v3Key: "toastOk" },
    toastInvalidT: { v3Key: "toastInvalidT" },
    toastFailT: { v3Key: "toastFailT" },
  },
};
