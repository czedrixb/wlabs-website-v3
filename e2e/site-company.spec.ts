import { test, expect } from "@playwright/test";

// WOS-332: Company's three segmented panels, replacing the WOS-314 stub.
// story ships prose + the 5-entry timeline + values + partnership CTA —
// the interactive `sp-rail` "reading log" timeline is deliberately not
// ported in this pass (see scripts/v3-content-manifest.mjs's header and
// the WOS-332 plan's M5 note).

test.describe("company: team panel", () => {
  test("23 members across 5 non-empty groups; 19 photos, 4 monograms", async ({ page }) => {
    await page.goto("/ko/company/team");
    await expect(page.locator(".team-group")).toHaveCount(5);
    await expect(page.locator(".member")).toHaveCount(23);
    await expect(page.locator(".member.has-av")).toHaveCount(19);
    await expect(page.locator(".member:not(.has-av)")).toHaveCount(4);
  });

  test("SegNav marks Team active", async ({ page }) => {
    await page.goto("/ko/company/team");
    await expect(page.locator('.seg a[aria-current="page"]')).toHaveText("팀");
  });
});

test.describe("company: insights panel", () => {
  test("5 news items render; the kind filter narrows them", async ({ page }) => {
    await page.goto("/ko/company/insights");
    await expect(page.locator(".news-item")).toHaveCount(5);

    await page.locator(".filters-track").getByRole("button", { name: "제품 노트" }).click();
    await expect(page.locator(".news-item")).toHaveCount(1);
    await expect(page.locator(".news-item").first()).toHaveAttribute("data-kind", "product");
  });

  test("the product-note item links to Work → Products", async ({ page }) => {
    await page.goto("/ko/company/insights");
    const productNote = page.locator('.news-item[data-kind="product"]');
    await productNote.getByRole("link").click();
    await expect(page).toHaveURL(/\/ko\/work\/products$/);
  });
});

test.describe("company: story panel", () => {
  test("renders the 5-entry timeline and 4 values", async ({ page }) => {
    await page.goto("/ko/company/story");
    await expect(page.locator("ol.timeline li")).toHaveCount(5);
    await expect(page.locator(".values article")).toHaveCount(4);
    await expect(page.locator(".cta-panel")).toContainText("파트너십");
  });

  test("timeline entries reveal (.in) once scrolled into view", async ({ page }) => {
    await page.goto("/ko/company/story");
    await page.locator("ol.timeline li").first().scrollIntoViewIfNeeded();
    await expect(page.locator("ol.timeline li").first()).toHaveClass(/in/, { timeout: 3000 });
  });
});

test.describe("company: /en translates", () => {
  test("team/insights/story render English copy", async ({ page }) => {
    await page.goto("/en/company/team");
    await expect(page.locator(".member").first()).toContainText("CEO");

    await page.goto("/en/company/insights");
    await expect(page.locator(".news-item").first()).toContainText("Science Exchange");

    await page.goto("/en/company/story");
    await expect(page.locator(".cta-panel")).toContainText("Partnership");
  });
});
