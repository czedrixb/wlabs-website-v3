import { test, expect } from "@playwright/test";

// WOS-337: the three next/font families (Quicksand/Raleway/Noto Sans KR,
// src/lib/fonts.ts) never actually rendered anywhere. siteFontVariables was
// mounted on a <div> inside SiteChrome, but site.css's --display/--body
// tokens are declared on :root (and html:lang(ko)) — a custom property
// whose value contains a var() to something out of scope is invalid at
// computed-value time on the element that declares it, so --display/--body
// were poisoned right at :root and every font/weight/line-height shorthand
// built on them silently fell back to the browser default, on every route.
// Fixed by mounting siteFontVariables on <html> itself
// (src/app/(frontend)/[locale]/layout.tsx). This is the assertion that
// would have caught the original bug: real computed font-family, not just
// "the page renders".
test.describe("fonts: Quicksand/Raleway/Noto Sans KR actually apply", () => {
  test("(site) route: body resolves to the Raleway/Noto stack, h1 to Quicksand", async ({ page }) => {
    await page.goto("/ko");
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont).not.toMatch(/^(Times|serif)/i);
    expect(bodyFont.toLowerCase()).toMatch(/raleway|noto sans kr/);

    const h1Font = await page
      .locator("h1")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(h1Font.toLowerCase()).toMatch(/quicksand/);
  });

  test("(blog) route: shares the same font stack as (site)", async ({ page }) => {
    // The /blog listing page is gone — /blog/[slug] is the one (blog)-group
    // route left (its layout.tsx is otherwise unchanged by that removal).
    await page.goto("/ko/blog/publishing-workflow-for-editors");
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont.toLowerCase()).toMatch(/raleway|noto sans kr/);
  });

  test("en locale: --body resolves Raleway before Noto Sans KR", async ({ page }) => {
    await page.goto("/en");
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont.toLowerCase().indexOf("raleway")).toBeGreaterThanOrEqual(0);
  });
});
