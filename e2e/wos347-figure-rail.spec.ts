import { test, expect } from "@playwright/test";
import path from "path";

// WOS-347: AISEN body images move to the sticky left figure rail on desktop
// (≥900px) and stay inline, in reading order, on mobile — each image visible
// exactly once per viewport. extractAisenFigures (src/lib/site/aisenFigures.ts)
// wraps each content_html <img> + caption <p><em>…</em></p> into
// .ins-inline-fig (hidden ≥900px) and feeds the same figures to the rail
// (hidden <900px). Viewports here sit well clear of the 900px boundary:
// the chromium project's 1280×720 default, and 390×844 for mobile.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";

// The caption paragraphs from e2e/fixtures/aisen/posts.ko.json (ins-4).
const CAP1 = "스캔 스택, DEJ 오버레이가 적용된 B-scan, 그리고 결과 패널.";
const CAP2 = "BrainArch — 원본 CT 슬라이스 위에 표시된 분할 경계.";

test.describe("desktop ≥900px: figures live in the sticky rail only", () => {
  test("rail shows both figures with captions; inline twins hide; hero unchanged", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-4");

    // Cover/hero treatment is untouched by the split.
    await expect(page.locator(".ins-hero.has-shot .ins-shot")).toBeAttached();

    const rail = page.locator(".ins-figs .ins-fig");
    await expect(rail).toHaveCount(2);
    await expect(rail.nth(0).locator("figcaption")).toHaveText(CAP1);
    await expect(rail.nth(1).locator("figcaption")).toHaveText(CAP2);
    await expect(rail.nth(0).locator("img")).toBeVisible();
    await expect(rail.nth(1).locator("img")).toBeVisible();

    // The inline twins are attached but display:none at this width.
    const inline = page.locator(".ins-prose .ins-inline-fig");
    await expect(inline).toHaveCount(2);
    await expect(inline.nth(0)).toBeHidden();
    await expect(inline.nth(1)).toBeHidden();

    // Exactly once: one visible <img> per body-image URL (the hero shot is a
    // CSS background, so it never counts here).
    await expect(page.locator('img[src*="skinarch.webp"]:visible')).toHaveCount(1);
    await expect(page.locator('img[src*="brainarch.webp"]:visible')).toHaveCount(1);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos347-rail-desktop.png"),
      fullPage: false,
    });
  });

  test("the lightbox opens from a rail figure and returns focus on Escape", async ({ page }) => {
    await page.goto("/ko/insights/ins-4");

    const firstBtn = page.locator(".ins-figs .ins-fig-btn").first();
    await firstBtn.click();

    const lbox = page.locator('.lbox[role="dialog"]');
    await expect(lbox).toBeVisible();
    await expect(lbox.locator("figcaption")).toHaveText(CAP1);

    await page.keyboard.press("Escape");
    await expect(lbox).toHaveCount(0);
    await expect(firstBtn).toBeFocused();
  });
});

test.describe("mobile <900px: figures stay inline in reading order", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("rail hides; inline figures show at their original positions", async ({ page }) => {
    await page.goto("/ko/insights/ins-4");

    await expect(page.locator(".ins-figs")).toBeHidden();

    const inline = page.locator(".ins-prose .ins-inline-fig");
    await expect(inline).toHaveCount(2);
    await expect(inline.nth(0)).toBeVisible();
    await expect(inline.nth(1)).toBeVisible();

    // Reading order: in ins-4 the figures open the body, skinarch first.
    await expect(page.locator(".ins-prose .post-body > *").first()).toHaveClass(/ins-inline-fig/);
    await expect(inline.nth(0).locator("img")).toHaveAttribute("src", /skinarch\.webp/);
    await expect(inline.nth(0).locator("figcaption")).toHaveText(CAP1);
    await expect(inline.nth(1).locator("img")).toHaveAttribute("src", /brainarch\.webp/);
    await expect(inline.nth(1).locator("figcaption")).toHaveText(CAP2);

    await expect(page.locator('img[src*="skinarch.webp"]:visible')).toHaveCount(1);
    await expect(page.locator('img[src*="brainarch.webp"]:visible')).toHaveCount(1);

    // Cover/hero still renders on mobile.
    await expect(page.locator(".ins-hero.has-shot .ins-shot")).toBeAttached();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos347-inline-mobile.png"),
      fullPage: false,
    });
  });
});

test.describe("regression: articles without body images", () => {
  test("desktop keeps the empty rail aside (column reservation)", async ({ page }) => {
    await page.goto("/ko/insights/ins-1");
    const aside = page.locator(".ins-figs");
    await expect(aside).toBeAttached();
    await expect(aside.locator(".ins-fig")).toHaveCount(0);
  });

  test("mobile hides the empty rail", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ko/insights/ins-1");
    await expect(page.locator(".ins-figs")).toBeHidden();
  });
});
