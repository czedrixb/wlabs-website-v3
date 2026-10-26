import { test, expect } from "@playwright/test";

// WOS-355: before this, any URL whose first path segment wasn't ko/en (a
// mistyped path, a stale inbound link, /wp-admin probes, etc.) fell through
// to Next's unbranded default 404 — notFound() was thrown by the frontend's
// ROOT layout (src/app/(frontend)/[locale]/layout.tsx), which has no parent
// boundary to catch it. The guard moved down into the (site)/(blog) group
// layouts, and a new src/app/(frontend)/[locale]/not-found.tsx now catches
// that throw and renders the same branded SiteNotFound used for an unknown
// product/project slug (WOS-351). This locks that in alongside the existing
// valid-locale 404 paths, which must keep behaving exactly as before.

test.describe("WOS-355 branded 404 for an unsupported locale segment", () => {
  for (const path of ["/test", "/test/deep/path", "/fr/insights/anything"]) {
    test(`${path} renders the branded 404 with chrome, status 404`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
      await expect(page.locator(".ins-404-code")).toHaveText("404");
      // branded means inside SiteChrome — footer and header present
      await expect(page.locator("footer .sitemap")).toBeVisible();
      await expect(page.locator("header")).toBeVisible();
    });
  }
});

test.describe("WOS-355 regression: valid-locale 404s are unaffected", () => {
  test("unknown product slug still renders the WOS-351 branded 404", async ({ page }) => {
    const res = await page.goto("/ko/products/wos355-no-such-product");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
  });

  test("unknown insights slug still renders InsightNotFound, not SiteNotFound", async ({ page }) => {
    const res = await page.goto("/ko/insights/wos355-no-such-post");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "요청하신 글을 찾을 수 없습니다." })).toBeVisible();
    // both 404s share the ins-hero/.ins-404-code CSS, but only InsightNotFound
    // adds breadcrumbs and a "latest insights" rail — that's the real signal
    // this is still the richer (blog)-group 404, not SiteNotFound.
    await expect(page.locator(".crumbs")).toBeVisible();
    await expect(page.locator(".ins-more")).toBeVisible();
  });
});

test.describe("WOS-355 regression: real locales still 200", () => {
  for (const path of ["/ko", "/en"]) {
    test(`${path} still renders normally`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }
});
