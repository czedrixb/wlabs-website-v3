import { test, expect } from "@playwright/test";

// WOS-336: the smaller behavioral parity items — the chip-glossary tooltip
// (v3 site/index.html:3688-3724), the desktop header sampler's on-navy
// awareness on the new contact surface, and the SpectrogramStack's
// Escape-to-close (:4468-4472). Covers only these behaviors (per the
// global testing policy's "focus only on the changes").

test.describe("chip glossary tooltips", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("ko: hovering a service chip shows the shared tooltip with the Korean definition", async ({ page }) => {
    await page.goto("/ko/work/services");
    const chip = page.locator('.chip[data-tip="Computer vision"]').first();
    await chip.hover();

    const tip = page.locator("#chip-tip");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveClass(/on/);
    await expect(tip.locator("b")).toHaveText("Computer vision");
    await expect(tip).toContainText("이미지와 영상을 읽어");
    await expect(chip).toHaveAttribute("aria-describedby", "chip-tip");
  });

  test("ko: chips are keyboard-focusable and Escape hides the tooltip", async ({ page }) => {
    await page.goto("/ko/work/services");
    const chip = page.locator('.chip[data-tip="NLP / LLM"]').first();
    await chip.focus();
    await expect(page.locator("#chip-tip")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("#chip-tip")).toBeHidden();
    await expect(chip).not.toHaveAttribute("aria-describedby", "chip-tip");
  });

  test("ko: the tuner's Korean-labelled chips carry their English term explicitly", async ({ page }) => {
    await page.goto("/ko/contact");
    const chip = page.locator('.sp-tuner-tags .chip[data-tip="Segmentation"]');
    await expect(chip).toHaveText("세그멘테이션");
    await chip.hover();
    const tip = page.locator("#chip-tip");
    await expect(tip.locator("b")).toHaveText("Segmentation");
  });

  test("en: the definition follows the locale", async ({ page }) => {
    await page.goto("/en/work/services");
    await page.locator('.chip[data-tip="SaaS"]').first().hover();
    await expect(page.locator("#chip-tip")).toContainText("Software as a service");
  });
});

test.describe("header sampler + stack escape", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the header reads the contact page's navy surface as dark", async ({ page }) => {
    await page.goto("/ko/contact");
    await expect(page.locator("header.header")).toHaveClass(/is-dark/, { timeout: 5_000 });
  });

  test("Escape closes an open service band and returns focus to its button", async ({ page }) => {
    await page.goto("/ko");
    const firstBtn = page.locator(".sp-band-btn").first();
    await firstBtn.scrollIntoViewIfNeeded();
    await firstBtn.click();
    await expect(page.locator(".sp-band.is-open")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(page.locator(".sp-band.is-open")).toHaveCount(0);
    await expect(firstBtn).toBeFocused();
  });
});
