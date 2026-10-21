import { test, expect } from "@playwright/test";

// WOS-349: the home stats band's canvas ripple engine (eye strain, Joseph's
// 2026-10-21 feedback) is replaced by Karlo's pure-CSS calm background — two
// soft light pools drifting on the band's own pseudo-elements — and the
// proof-grid dividers drop the full-glass pane treatment for a dark seam.

const BAND = "section.sp-field.sp-field--dark";

test.describe("WOS-349: calm stats band", () => {
  test("the ripple canvas is gone; the drift layers animate in its place", async ({ page }) => {
    await page.goto("/ko");
    const band = page.locator(BAND);
    await band.scrollIntoViewIfNeeded();
    await expect(band).toBeVisible();

    // 1. No canvas element anywhere in the band.
    await expect(band.locator("canvas")).toHaveCount(0);

    // 2. The two pseudo-element light pools, on their out-of-step loops.
    const pseudo = await band.evaluate((el) => {
      const read = (which: string) => {
        const s = getComputedStyle(el, which);
        return {
          animationName: s.animationName,
          animationDuration: s.animationDuration,
          background: s.backgroundImage,
          zIndex: s.zIndex,
        };
      };
      return { before: read("::before"), after: read("::after") };
    });
    expect(pseudo.before.animationName).toBe("sp-drift-a");
    expect(pseudo.before.animationDuration).toBe("26s");
    expect(pseudo.before.background).toContain("radial-gradient");
    expect(pseudo.after.animationName).toBe("sp-drift-b");
    expect(pseudo.after.animationDuration).toBe("34s");
    expect(pseudo.after.background).toContain("radial-gradient");
    // Both sit under .sp-field-inner (z-index 1).
    expect(pseudo.before.zIndex).toBe("0");
    expect(pseudo.after.zIndex).toBe("0");
  });

  test("tile dividers are a dark seam with no glass shadow", async ({ page }) => {
    await page.goto("/ko");
    const grid = page.locator(`${BAND} .proof-grid`);
    await grid.scrollIntoViewIfNeeded();
    await expect(grid).toHaveCSS("background-color", "rgb(16, 34, 47)");
    await expect(grid).toHaveCSS("box-shadow", "none");
  });

  test("reduced motion holds the background fully still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ko");
    const band = page.locator(BAND);
    await band.scrollIntoViewIfNeeded();
    const names = await band.evaluate((el) => [
      getComputedStyle(el, "::before").animationName,
      getComputedStyle(el, "::after").animationName,
    ]);
    expect(names).toEqual(["none", "none"]);
  });

  test("the background is pure CSS — same composition with JavaScript off", async ({
    browser,
  }, testInfo) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      baseURL: testInfo.project.use.baseURL,
    });
    const page = await ctx.newPage();
    await page.goto("/ko");
    const band = page.locator(BAND);
    await band.scrollIntoViewIfNeeded();
    await expect(band).toBeVisible();
    await expect(band.locator("canvas")).toHaveCount(0);
    const painted = await band.evaluate((el) => ({
      ground: getComputedStyle(el).backgroundImage,
      before: getComputedStyle(el, "::before").backgroundImage,
      after: getComputedStyle(el, "::after").backgroundImage,
    }));
    expect(painted.ground).toContain("linear-gradient");
    expect(painted.before).toContain("radial-gradient");
    expect(painted.after).toContain("radial-gradient");
    await ctx.close();
  });
});
