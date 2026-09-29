import { test, expect } from "@playwright/test";

// WOS-314 Milestone 1: Home's real content — the scroll-driven hero deck,
// mod-field's proof band (counters + verified rolls), mod-band's services
// accordion, and the FAQ accordion. WOS-332 adds the project strip, the
// six-face company teaser and the hero's node-tips snippets — all three
// were deferred out of this file until PROJECTS/TEAM existed as typed
// constants.

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

test.describe("home: project strip (WOS-332)", () => {
  test("4 project cards render, capped by the strip's own limit", async ({ page }) => {
    await page.goto("/ko");
    await page.locator("#home-projects").scrollIntoViewIfNeeded();
    await expect(page.locator("#home-projects .pcard")).toHaveCount(4);
    await expect(page.locator("#home-projects .pcta")).toBeVisible();
  });

  test("filter pills switch the rendered set", async ({ page }) => {
    await page.goto("/ko");
    await page.locator("#home-projects").scrollIntoViewIfNeeded();
    const track = page.locator("#home-projects .filters-track");
    await track.getByRole("button", { name: "헬스 & 웰니스" }).click();
    await expect(page.locator("#home-projects .pcard")).toHaveCount(2);
    await expect(page.locator("#home-projects .pcard").first()).toContainText("피부");
  });

  test("/en shows English project titles", async ({ page }) => {
    await page.goto("/en");
    await page.locator("#home-projects").scrollIntoViewIfNeeded();
    await expect(page.locator("#home-projects .pcard").first()).toContainText("Skin Optics");
  });
});

test.describe("home: company teaser (WOS-332)", () => {
  test("six faces render plus the overflow chip", async ({ page }) => {
    await page.goto("/ko");
    const avatars = page.locator(".company-teaser .avatars");
    await avatars.scrollIntoViewIfNeeded();
    await expect(avatars.locator("> img, > span.initial")).toHaveCount(6);
    await expect(avatars.getByText("+17")).toBeVisible();
  });
});

test.describe("home: hero node-tips (WOS-332)", () => {
  test("one callout per hero node, each linking into the site", async ({ page }) => {
    await page.goto("/ko");
    const tips = page.locator(".node-tips .ntip");
    await expect(tips).toHaveCount(8);
    const hrefs = await page.locator(".node-tips .ntip-box").evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs).toHaveLength(8);
    for (const href of hrefs) expect(href).toMatch(/^\/ko\//);
  });

  test("hovering a tip reveals its subtitle", async ({ page }) => {
    await page.goto("/ko");
    const box = page.locator(".node-tips .ntip-box").first();
    // force: true — the tip is under continuous rAF motion (idle drift),
    // so Playwright's "wait for stable position" actionability check would
    // never settle; the drift itself is the thing this test exists beside,
    // not something worth pausing for a hover assertion.
    await box.hover({ force: true });
    await expect(box.locator(".sub")).toBeVisible();
  });

  test("prefers-reduced-motion hides the node-tips layer", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ko");
    await expect(page.locator(".node-tips")).toBeHidden();
  });
});
