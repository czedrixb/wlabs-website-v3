import { test, expect } from "@playwright/test";

// WOS-336: Home's two previously missing v3 sections — the products 3-card
// preview (index.html:2313-2342) and the closing "다음 단계" CTA panel
// (:2424-2435) — plus the sprite-backed watermark the Company partnership
// panel was missing. Covers only these additions (per the global testing
// policy's "focus only on the changes").

test.describe("home products preview + closing CTA", () => {
  test("ko: the products preview renders three cards between services and projects", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.getByRole("heading", { name: "현장의 문제에서 출발한 세 가지 제품." })).toBeVisible();

    const cards = page.locator(".cards .card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole("link", { name: "SkinArch" })).toHaveAttribute("href", "/ko/products/skinarch");
    await expect(cards.nth(1).getByRole("link", { name: "WIZ Assistant" })).toHaveAttribute("href", "/ko/products/wiz");
    await expect(cards.nth(2).getByRole("link", { name: "BrainArch" })).toHaveAttribute("href", "/ko/products/brainarch");
    // RUO badges on the two imaging products only (v3 keeps them English).
    await expect(cards.locator(".ruo")).toHaveCount(2);
    await expect(cards.nth(0).locator(".foot .small")).toHaveText("가격은 문의");
    await expect(cards.nth(1).locator(".foot .small")).toHaveText("월 구독");
  });

  test("ko: the closing CTA panel renders with watermark and sheet triggers", async ({ page }) => {
    await page.goto("/ko");
    const panel = page.locator(".cta-panel.on-navy");
    await expect(panel).toHaveCount(1);
    await expect(panel.getByText("다음 단계")).toBeVisible();
    // The watermark resolves against the LogoSprite symbol.
    await expect(panel.locator('svg.wmark use[href="#logo-icon-white"]')).toHaveCount(1);
    await expect(panel.locator('[data-contact="general"]')).toBeVisible();
    await expect(panel.locator('[data-contact="newsletter"]')).toBeVisible();
    // The sprite itself is mounted once, page-level (also fixes the hero
    // dp-mark's previously dangling <use>).
    await expect(page.locator("symbol#logo-icon-white")).toHaveCount(1);
    await expect(page.locator("symbol#logo-icon-black")).toHaveCount(1);
  });

  test("en: the products preview and CTA panel translate", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Three products that started with a real problem." })).toBeVisible();
    await expect(page.locator(".cta-panel").getByText("Next step")).toBeVisible();
  });

  test("company story: the partnership panel now carries the v3 watermark", async ({ page }) => {
    await page.goto("/ko/company/story");
    const panel = page.locator(".cta-panel.on-navy");
    await expect(panel.locator('svg.wmark use[href="#logo-icon-white"]')).toHaveCount(1);
    await expect(panel.locator('[data-contact="partnership"]')).toBeVisible();
  });
});
