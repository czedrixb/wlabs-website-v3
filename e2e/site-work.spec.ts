import { test, expect } from "@playwright/test";

// WOS-332: Work's three segmented panels, replacing the WOS-314 stub
// (a bare <h1> echoing the segment label). services/products/cases are
// each a real route now (SegNav), not a client-side tab.

test.describe("work: services panel", () => {
  test("renders 5 svc-detail articles with their own anchors", async ({ page }) => {
    await page.goto("/ko/work/services");
    const details = page.locator(".svc-detail");
    await expect(details).toHaveCount(5);
    await expect(page.locator("#svc-ai")).toBeVisible();
    await expect(page.locator("#svc-ops")).toBeVisible();
    await expect(details.first()).toContainText("AI·지능형 자동화");
  });

  test("each service's related rail links into the site", async ({ page }) => {
    await page.goto("/ko/work/services");
    const first = page.locator(".svc-detail").first();
    const relLink = first.locator(".rel-item").first();
    await expect(relLink).toHaveAttribute("href", /^\/ko\/(projects|products)\//);
  });

  test("SegNav marks Services active and links to Products/Projects", async ({ page }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator('.seg a[aria-current="page"]')).toHaveText("서비스");
    await page.locator(".seg a", { hasText: "제품" }).click();
    await expect(page).toHaveURL(/\/ko\/work\/products$/);
  });
});

test.describe("work: products panel", () => {
  test("renders the 3 product teaser cards with RUO badges where due", async ({ page }) => {
    await page.goto("/ko/work/products");
    const cards = page.locator(".panel .cards .card");
    await expect(cards).toHaveCount(3);
    await expect(cards.filter({ hasText: "SkinArch" }).locator(".ruo")).toBeVisible();
    await expect(cards.filter({ hasText: "WIZ Assistant" }).locator(".ruo")).toHaveCount(0);
  });

  test("card links resolve to the product detail page", async ({ page }) => {
    await page.goto("/ko/work/products");
    await page.locator(".card", { hasText: "SkinArch" }).getByRole("link", { name: "SkinArch" }).click();
    await expect(page).toHaveURL(/\/ko\/products\/skinarch$/);
  });
});

test.describe("work: cases panel", () => {
  test("renders all 8 projects (unlimited, unlike the Home strip) with a live count", async ({ page }) => {
    await page.goto("/ko/work/cases");
    await expect(page.locator(".pgrid .pcard")).toHaveCount(8);
    await expect(page.locator('[role="status"]')).toContainText("8");
  });

  test("filtering to one category updates both the grid and the count", async ({ page }) => {
    await page.goto("/ko/work/cases");
    await page.locator(".filters-track").getByRole("button", { name: "교육 & 학습" }).click();
    await expect(page.locator(".pgrid .pcard")).toHaveCount(2);
    await expect(page.locator('[role="status"]')).toContainText("2");
  });
});

test.describe("work: /en translates", () => {
  test("services/products/cases render English copy", async ({ page }) => {
    await page.goto("/en/work/services");
    await expect(page.locator(".svc-detail").first()).toContainText("AI & Intelligent Automation");

    await page.goto("/en/work/products");
    await expect(page.locator(".card").first()).toContainText("Imaging");

    await page.goto("/en/work/cases");
    await expect(page.locator(".pgrid .pcard")).toHaveCount(8);
  });
});
