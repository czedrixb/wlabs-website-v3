# WOS-351 — Full-site QA findings log

Sweep of the deployed site (`https://wlabs-website-v3.vercel.app`), 2026-10-23:
22 routes × {ko,en} × {pc 1440×900, tablet 834×1194, mobile 390×844} = 132 page
states, compared against the design reference (`wlabs-website-v3/site/index.html`,
Depth build) at the same matrix. Harness: `e2e/wos351-qa-sweep.spec.ts`
(`--project=qa`) + `scripts/wos351-capture-reference.mjs`; interactions/link
probe on top. Known-open reference defects (its `docs/QA-CHECKLIST.md` §2) were
pre-filtered and are not logged here. Suspected occlusions from full-page
screenshot stitching (fixed header/tab bar painted mid-page) were re-verified
live at real viewports before logging — all of them proved to be capture
artifacts, not site bugs.

Severity: blocker / major / minor / nit.
Disposition: `fix-here` (this branch) / `ticket` (under WOS-309) / `question` (Joseph/Karlo).

## Findings

| ID | Route | Locale | Device | Severity | Description | Evidence | Ref delta | Disposition | Status |
|---|---|---|---|---|---|---|---|---|---|
| WOS351-F01 | any unknown (site) URL | both | all | major | Unknown site URLs rendered Next's default unbranded 404 (no chrome, no locale, no recovery links) while /insights/* had a designed 404. | interactions/site-404-ko.png | Ref has no 404 state at all (§6 "not built yet") — the implemented blog 404 sets the bar. | fix-here | fixed — `(site)/not-found.tsx` + `[...rest]` catch-all + `SiteNotFound.tsx` |
| WOS351-F02 | footer (site-wide) | both | all | major | Footer social row (Facebook/LinkedIn/Instagram pills, real account URLs) missing on every page; present in the reference between sitemap and legal block (v3 :3354-3358). | impl/home/ko-pc.png footer vs ref | Ref shows the 3-pill row on all combos. | fix-here | fixed — `Footer.tsx` + `.foot-social` CSS |
| WOS351-F03 | footer (site-wide) | both | all | minor | Footer lockup used the multicolor/brown `primary-land.svg`; the reference footer uses the mono ink variant (`#logo-h-ink`). | impl/company-story/ko-pc.png footer | Ref footer logo is ink #182731. | fix-here | fixed — `land-dark.svg` |
| WOS351-F04 | company-insights card | ko (worst), en | all | major | Ink title/summary over a dark cover gradient on the "작은 팀이 AI로…" card — title tail borderline unreadable; the card scrim faded to transparent before the 84%-wide text zone ended. | impl/company-insights/ko-mobile.png card 1 | Ref covers keep the text zone light. | fix-here | fixed — scrim stops strengthened (site.css MOD insights) |
| WOS351-F05 | home hero callouts | both | all | minor | Long CMS-driven node-tip callouts (`.ntip-box`, nowrap) run off the viewport edge ("INSIGHTS REGISTERED AS AN APPROVED…", "프로젝트 PAGODA TALKING P…"). | impl/home/en-pc--scrolled.png right edge | Ref's shorter sample strings mostly fit; same mechanism. | fix-here | fixed — max-width + ellipsis |
| WOS351-F06 | products/projects detail | both | all | minor | Hairline border above the first section after the hero (`.prod-sec` border-top) — design QA §3 says no border above the first section; v3 hides this edge under its full-bleed capture. | impl/projects-lingrid/ko-pc.png y≈385 | Ref shows clean whitespace there. | fix-here | fixed — `.prod-head+.prod-sec{border-top:0}` |
| WOS351-F07 | contact form | both | all | minor | Topic/문의 주제 select rendered empty by default (blank required select reads as broken); the reference's select shows the first topic preselected (no placeholder option). | impl/contact/ko-pc.png form | Ref preselects "General project". | fix-here | fixed — ContactForm default + reset to first topic |
| WOS351-F08 | EN insights surfaces | en | all | major | AISEN EN-channel post `ins-1` is untranslated: Korean title "Science Exchange 인증 공급업체가 되었습니다" + empty excerpt on the EN list, EN prev/next and EN "More insights". Verified live: `/en/insights/ins-1` h1 is Korean. | impl/company-insights/en-pc.png | Ref EN shows the translated title. | ticket (AISEN content) | open |
| WOS351-F09 | EN insights dates | en | all | minor | All EN-channel publish dates read "2026 · 10" (ins-N `published_at` ≈ 2026-10-20/21) while KO keeps the historical spread (08/03/01). Data in AISEN, not code — EN variants were bulk-published in Oct. | impl/insights-detail/en-pc.png | Ref EN dates spread. | ticket (same AISEN content ticket) | open |
| WOS351-F10 | company-insights card | both | all | major | Science Exchange badge cover renders full-bleed as card ground: third-party promo copy ("Order Now", "VERIFIED SUPPLIER" ribbon) reads as part of our card. The card template HAS a contained `is-mark` treatment (small badge top-right, no scrim) but AISEN covers never use it. | impl/company-insights/ko-mobile.png card 3 | Ref renders the badge small, top-right. | ticket + question (swap cover in AISEN, or let AISEN posts mark logo covers) | open |
| WOS351-F11 | footer legal links | both | all | minor | "Privacy policy"/"Terms" link to /company; the reference has since added real legal screens (`#legal/privacy`, `#legal/terms`). | impl footer | Ref `legal` screen exists (newer than its own QA doc). | ticket (+ decision) | open |
| WOS351-F12 | products/projects hero | both | all | major | Head treatment deviates from the approved design: the reference fills the head with the capture (caption + CTAs overlaid, bleeding behind the header); the implementation renders a contained capture card beside/below the text, leaving the head mostly cream. Uniform across all 3 product + 8 project pages. | impl/products-skinarch/ko-pc.png vs ref | Systemic, by far the largest visual delta. | ticket + question (Karlo) | open |
| WOS351-F13 | company-team | both | all | minor | Full-name secondary line missing on ~13 non-Korean members (ref shows "Czedrix / Czedrix Barcena" etc.); Korean members' hangul names do render. Possibly deliberate (consent). | impl/company-team/ko-pc.png | Ref shows full names. | question | open |

### Verified non-issues (checked and cleared)

- All "hidden H1/CTA/hero" mobile findings and the contact ko-pc "header band mid-hero": full-page screenshot stitching artifacts — live viewport checks show everything visible (live-verify/*.png).
- Products breadcrumb "inconsistency": `.crumbs` present in the DOM on all product pages — capture-offset artifact.
- Home en-tablet empty team avatars: lazy-load timing in the capture; all 6 load live.
- Stats band scramble gibberish in some captures: the WOS-349/350-era scramble animation caught mid-roll; settles live (ref captures show the same).
- Insights tablet line-clamp (title/excerpt ellipsis): deliberate WOS-342 follow-up (one long CMS excerpt stretched rows) — listed as a question, not a defect.
- Marketing roster drift vs ref (Windy, no Zyra): current real roster per WOS-341; impl is ahead of the ref.
- Impl is ahead of ref in several spots: real team photos where ref has monograms, real project artwork where ref has ILLUSTRATION placeholders, a KO leak in ref's EN story fixed in impl, ~44px filter pills vs ref's known 28px tap targets.

### Automated sweep + probes (2026-10-23, deployed)

- 132-state sweep: no horizontal overflow, no broken images, no console errors, no failed asset responses anywhere.
- Link crawl: 56 unique internal URLs, 0 broken. Externals present: 3 social URLs now added by F02's fix, Google policy links on the contact form.
- Interactions: lang toggle (home + insights detail), search typing/results (12 hits for "skin"), FAQ exclusivity, project filters (8→2 items), mobile tab bar — all behave. Contact submit is consent-gated like the reference; invalid submit never POSTs to /api/contact.
- EN insights detail renders fully translated for the real post; translated posts keep the Korean slug in the /en URL (question, not a defect).

## Open UI/UX questions for Joseph / Karlo

1. **Product/project hero head (F12)** — is the contained capture-card an accepted simplification, or should the capture fill the head full-bleed per the reference? Largest systemic delta.
2. **Science Exchange badge cover (F10)** — replace the cover in AISEN, or teach AISEN posts the `is-mark` contained-badge treatment? Today third-party promo copy ("Order Now") reads as ours.
3. **Untranslated posts on EN surfaces (F08)** — hide untranslated AISEN EN posts, or keep the Korean fallback? And should EN publish dates mirror the original KO dates (F09)?
4. **Legal pages (F11)** — the reference now has Privacy/Terms screens; implement them, link externally, or drop the footer links until ready? (PIPA was flagged P1 in the content audit.)
5. **KO localization of service titles/product badges** — impl localizes ("AI·지능형 자동화", "이미징/연구용") where the approved reference keeps English. Which is final?
6. **Team full names (F13)** — deliberately withheld for non-Korean members, or should they render as in the reference?
7. **CTA wrap ruling** — hero CTA pairs stack at some widths (products EN tablet, projects EN mobile / lingrid KO tablet) while the reference is itself inconsistent; pick the intended wrap breakpoint.
8. **Consent checkbox affordance** — near-invisible 1px outline on the pale panel (matches reference exactly); intended for a required legal consent?
9. **Floating EN|KO pill** — overlaps headings/eyebrows at many scroll positions (matches reference class of behavior); dock it content-safe or keep?
10. **EN URLs with Korean slugs** — translated AISEN posts keep the KO slug under /en (percent-encoded). Acceptable for SEO/sharing?
11. **Insights tablet line-clamp** — keep the deliberate clamp (uniform rows) or match the reference's grow-to-fit cards?
12. **Mobile insights-detail cover** — reference shows a standalone cover block under the hero at 390px; impl merges it into the hero. Keep?

## Re-verification

- WOS-349 (calm stats band): **PASS** — `e2e/wos349-calm-stats-band.spec.ts` green against the deployed site (2026-10-23, `--project=chromium --no-deps`), no regression.
- WOS-350 (header scroll background): **PASS** — `e2e/wos350-header-scroll-bg.spec.ts` green against the deployed site (same run; 12 tests, 21.9s).

## Fix verification

Fixes F01–F07 are regression-locked by `e2e/wos351-fixes.spec.ts` and verified
against a local production build (NEXT_PUBLIC_SERVER_URL=http://localhost:3000,
AISEN stub); they are live only after this branch deploys.
