// WOS-334: the v3 dictionary keys the ported /contact form needs — the
// form only (`#contact-form`, site/index.html:2713-2728), not the sp-tuner
// resonance finder or the #sheet-form slide-over, both deferred to a
// follow-up ticket (see the WOS-334 plan). Merged into the single
// generated dictionary by scripts/extract-v3-dictionary.mjs alongside
// WOS-331's MANIFEST and WOS-332's CONTENT_MANIFEST; see that file for the
// manifest shape and extraction rules.
//
// `rcNote` carries two <a href="https://policies.google.com/...">...</a>
// links mid-sentence (data-html in the source) — harvested as raw HTML,
// same convention as home.heroH1/ch2h/ch3h in v3-dictionary-manifest.mjs.
// src/lib/site/dictionary.ts splits it into a { lead, privacy, mid, terms,
// tail } shape so ContactForm.tsx never needs dangerouslySetInnerHTML.
//
// sent/sending/failed/invalid/needConsent are runtime status messages, not
// carried by any data-i element — their Korean lives in literal KO.*
// assignments at site/index.html:3217, harvested by a third pass
// extract-v3-dictionary.mjs adds alongside the existing data-i/data-i-attr
// sweeps (see that file's parseKoreanLiterals()).
export const CONTACT_MANIFEST = {
  contact: {
    contactH1: { v3Key: "contactH1" },
    contactLead: { v3Key: "contactLead" },
    reqNote: { v3Key: "reqNote" },
    fName: { v3Key: "fName" },
    fOrg: { v3Key: "fOrg" },
    fEmail: { v3Key: "fEmail" },
    fPhone: { v3Key: "fPhone" },
    fTopic: { v3Key: "fTopic" },
    fMsg: { v3Key: "fMsg" },
    consent1: { v3Key: "consent1" },
    consent2: { v3Key: "consent2" },
    send: { v3Key: "send" },
    errName: { v3Key: "errName" },
    errEmail: { v3Key: "errEmail" },
    errTopic: { v3Key: "errTopic" },
    rcNote: { v3Key: "rcNote", type: "html" },
    sent: { v3Key: "sent", type: "literal" },
    sending: { v3Key: "sending", type: "literal" },
    failed: { v3Key: "failed", type: "literal" },
    invalid: { v3Key: "invalid", type: "literal" },
    needConsent: { v3Key: "needConsent", type: "literal" },
  },
};
