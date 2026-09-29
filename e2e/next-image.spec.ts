import { test, expect } from "@playwright/test";

// WOS-334: product/team photography switched from plain <img> to
// next/image (TeamGrid.tsx, CompanyTeaser.tsx, products/[slug]/page.tsx).
// This only catches a regression that's easy to introduce silently: a
// forgotten next.config.ts images.localPatterns entry makes /_next/image
// 400 for every photo under /site/**, since localPatterns is an allowlist.
test.describe("product/team photography via next/image", () => {
  test("Company → Team photos resolve through /_next/image", async ({ page }) => {
    await page.goto("/ko/company/team");
    const photo = page.locator('.team img[src^="/_next/image"]').first();
    await expect(photo).toBeVisible();
    const src = await photo.getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/^image\//);
  });

  test("Home's company teaser avatars resolve through /_next/image", async ({ page }) => {
    await page.goto("/ko");
    const avatar = page.locator('.avatars img[src^="/_next/image"]').first();
    await expect(avatar).toBeVisible();
    const src = await avatar.getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
  });

  test("a product detail page's visual resolves through /_next/image", async ({ page }) => {
    await page.goto("/ko/products/skinarch");
    const visual = page.locator('.prod-visual img[src^="/_next/image"]').first();
    await expect(visual).toBeVisible();
    const src = await visual.getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
  });
});
