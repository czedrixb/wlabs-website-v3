import { test, expect } from "@playwright/test";

// WOS-314 Milestone 1: Home's real content — the scroll-driven hero deck,
// mod-field's proof band (counters + verified rolls), mod-band's services
// accordion, and the FAQ accordion. Project strip and company teaser are
// deliberately not covered — they need Step 6 content that doesn't exist
// yet, and Home doesn't render them either.

test.describe("home: hero", () => {
  test("renders the first chapter and the layered deck", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.getByRole("heading", { name: "복잡한 문제를" })).toBeVisible();
    await expect(page.locator(".dp-layer")).toHaveCount(4);
    await expect(page.locator(".timeline a").first()).toHaveClass(/active/);
  });

  test("scrolling advances the chapter and the timeline fill", async ({ page }) => {
    await page.goto("/ko");
    const travel = await page.evaluate(() => {
      const story = document.querySelector(".story") as HTMLElement;
      const stage = document.querySelector(".stage") as HTMLElement;
      return story.offsetHeight - stage.offsetHeight;
    });
    await page.evaluate((y) => window.scrollTo(0, y), travel * 0.4);
    await page.waitForTimeout(300);
    const secondChapterOpacity = await page
      .locator(".chapter")
      .nth(1)
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(secondChapterOpacity).toBeGreaterThan(0.5);
  });
});

test.describe("home: proof band (mod-field)", () => {
  test("counters settle to their real values once in view", async ({ page }) => {
    await page.goto("/ko");
    await page.locator(".proof").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-count="24"]')).toHaveText("24", { timeout: 3000 });
    await expect(page.locator('[data-count="2022"]')).toHaveText("2022", { timeout: 3000 });
    await expect(page.locator(".ok").first()).toContainText("Verified");
  });
});

test.describe("home: services (mod-band)", () => {
  test("five bands render and one expands on click", async ({ page }) => {
    await page.goto("/ko");
    await page.locator("#home-services").scrollIntoViewIfNeeded();
    const bands = page.locator(".sp-band");
    await expect(bands).toHaveCount(5);

    const first = bands.first();
    await expect(first).not.toHaveClass(/is-open/);
    await first.locator(".sp-band-btn").click();
    await expect(first).toHaveClass(/is-open/);
    await expect(first.locator(".sp-band-panel")).toContainText("문서, 이미지");
  });
});

test.describe("home: FAQ", () => {
  test("four questions render, one at a time expands", async ({ page }) => {
    await page.goto("/ko");
    await page.locator(".sp-faq2").scrollIntoViewIfNeeded();
    const items = page.locator(".sp-faq2-item");
    await expect(items).toHaveCount(4);

    await items.nth(0).locator(".sp-faq2-q").click();
    await expect(items.nth(0)).toHaveClass(/is-open/);
    await expect(items.nth(0)).toContainText("AI·지능형 자동화");

    await items.nth(1).locator(".sp-faq2-q").click();
    await expect(items.nth(1)).toHaveClass(/is-open/);
    await expect(items.nth(0)).not.toHaveClass(/is-open/);
  });
});
