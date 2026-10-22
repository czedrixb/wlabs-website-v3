import { test, expect } from "@playwright/test";

// WOS-350: once the page is scrolled the chrome bar carries its own ground so
// content passes behind the lockup instead of through it (Joseph's report:
// the logo/nav overlapped body text). Ground follows the section — cream over
// light content, navy when the bar sits over a dark section (the v3
// template's search-screen pattern, index.html:2045-2047) — and the bar stays
// transparent at the very top of the page, exactly as the template defines.

const CREAM = "rgb(244, 247, 249)"; // --cream (site.css:2013)
const NAVY = "rgb(21, 43, 59)"; // --navy, theme8 override (site.css:2041)
const TRANSPARENT = "rgba(0, 0, 0, 0)";

test.describe("WOS-350: mobile masthead ground on scroll", () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test("home: transparent at top, cream once scrolled, transparent again at top", async ({
    page,
  }) => {
    await page.goto("/ko");
    const bar = page.locator(".sp-mhead");
    await expect(bar).toHaveCSS("background-color", TRANSPARENT);

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(bar).toHaveClass(/is-tight/);
    await expect(bar).toHaveCSS("background-color", CREAM);

    // Back at the top the template behavior returns (release below y<8).
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar).not.toHaveClass(/is-tight/);
    await expect(bar).toHaveCSS("background-color", TRANSPARENT);
  });

  test("over a dark section the scrolled ground is navy, not a white band", async ({
    page,
  }) => {
    await page.goto("/ko/contact"); // self-declared .on-navy screen
    const bar = page.locator(".sp-mhead");
    // y=150 keeps the navy hero behind the lockup; deeper offsets put the
    // tuner's light panel there and the ground correctly falls back to cream.
    await page.evaluate(() => window.scrollTo(0, 150));
    await expect(bar).toHaveClass(/is-tight/);
    await expect(bar).toHaveClass(/on-dark/);
    await expect(bar).toHaveCSS("background-color", NAVY);
  });

  test("EN build behaves the same (AC: both locales)", async ({ page }) => {
    await page.goto("/en");
    const bar = page.locator(".sp-mhead");
    await expect(bar).toHaveCSS("background-color", TRANSPARENT);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(bar).toHaveCSS("background-color", CREAM);
  });
});

test.describe("WOS-350: desktop header ground on scroll", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("home: transparent at top (WOS-336 contract), cream once scrolled", async ({
    page,
  }) => {
    await page.goto("/ko");
    const header = page.locator(".header");
    await expect(header).toHaveCSS("background-color", TRANSPARENT);

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(header).toHaveClass(/is-scrolled/);
    await expect(header).toHaveCSS("background-color", CREAM);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveClass(/is-scrolled/);
    await expect(header).toHaveCSS("background-color", TRANSPARENT);
  });

  test("tabbed screens keep the merged cream band when scrolled (never navy)", async ({
    page,
  }) => {
    await page.goto("/ko/work/services");
    const header = page.locator(".header");
    await expect(header).toHaveCSS("background-color", CREAM);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(header).toHaveClass(/is-scrolled/);
    await expect(header).toHaveCSS("background-color", CREAM);
  });

  test("EN home gets the scrolled cream ground too", async ({ page }) => {
    await page.goto("/en");
    const header = page.locator(".header");
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(header).toHaveCSS("background-color", CREAM);
  });
});
