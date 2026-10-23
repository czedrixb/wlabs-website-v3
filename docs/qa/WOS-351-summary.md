# WOS-351 — QA summary (2026-10-23)

Full UI/UX QA of the deployed renewed site (`https://wlabs-website-v3.vercel.app`)
against Karlo's design reference (wlabs-website-v3 Depth build), per Joseph's
2026-10-22 request. Findings log with evidence: `docs/qa/WOS-351-findings.md`.

## Coverage

- **132 page states swept**: 22 routes (every site page, blog index/detail, both
  404s) × EN/KO × PC 1440 / tablet 834 / mobile 390, full-page screenshots +
  automated checks (`e2e/wos351-qa-sweep.spec.ts`, new `qa` Playwright project).
- **132 reference captures** at the same matrix from the design build
  (`scripts/wos351-capture-reference.mjs`), reviewed pair-by-pair.
- **Interactions & links**: 56 internal URLs crawled (0 broken); lang toggle,
  search, FAQ, project filters, mobile tab bar, contact validation gate — all pass.
- **WOS-349 / WOS-350 re-verified** on the deployed site: both spec suites green,
  no regression.

## Results

- Automated checks: clean across all 132 states (no overflow, broken images,
  console errors, or failed responses).
- **13 findings**: 7 fixed on this branch, 4 to ticket under WOS-309, 2 pure
  design questions. All screenshot-"blocker" occlusions proved to be capture
  artifacts after live re-verification.

### Fixed on this branch (verified locally, pending deploy)

| ID | Fix |
|---|---|
| F01 | Branded bilingual 404 for all site URLs (`(site)/not-found.tsx` + catch-all), matching the blog 404's design |
| F02 | Footer social row (Facebook/LinkedIn/Instagram) restored per reference |
| F03 | Footer lockup switched to the mono ink variant (`land-dark.svg`) |
| F04 | Insights-card scrim strengthened — ink text can no longer sit on dark covers |
| F05 | Hero node-tip callouts capped + ellipsized (long CMS titles ran off-viewport) |
| F06 | Hairline above the first detail-page section removed (design §3 rule) |
| F07 | Contact Topic select defaults to the first topic (was blank, read as broken) |

All locked by `e2e/wos351-fixes.spec.ts` (9 tests, green) and WOS-349/350 suites
re-run green locally after the fixes.

### To ticket under WOS-309

1. **AISEN EN content** — `ins-1` untranslated on EN (Korean title, empty
   excerpt) + all EN publish dates stamped 2026-10 (F08/F09).
2. **Science Exchange badge cover** renders full-bleed with third-party promo
   copy ("Order Now") as card ground (F10) — needs a cover swap or the
   `is-mark` contained treatment for AISEN posts.
3. **Legal pages** — footer Privacy/Terms still point at /company; the
   reference now has real legal screens (F11). Needs a decision (PIPA is P1).
4. **Product/project hero head** — contained capture card vs the reference's
   full-bleed head (F12). Largest systemic delta; needs Karlo's ruling.

### Open questions for Joseph / Karlo

See `WOS-351-findings.md` §Open questions — 12 items, headlined by the hero
head treatment, untranslated-post policy on EN, badge covers, legal pages,
KO-localized service titles, team full names, and the consent checkbox
affordance.
