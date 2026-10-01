import { test, expect } from "@playwright/test";

// WOS-336: the company/story sp-rail "reading log" (v3
// site/index.html:2526-2616 + MOD:rail :4485-4834) — scrubber, filter
// pills, honest counters and the 27-entry log. Covers the rail only (per
// the global testing policy's "focus only on the changes").

test.describe("company reading-log rail", () => {
  test("ko: the rail renders live with all 27 entries", async ({ page }) => {
    await page.goto("/ko/company/story");
    const rail = page.locator(".sp-rail");
    await expect(rail).toHaveClass(/is-live/);
    await expect(rail.locator(".sp-rail-entry")).toHaveCount(27);
    await expect(rail.locator("#sp-rail-status")).toHaveText("27개 항목 표시 · 최신순");
    await expect(rail.locator("#sp-rail-reading")).toHaveText("2026-09");
    // Six pills, each with its appended entry count; "전체" carries 27.
    const pills = rail.locator(".sp-rail-pill");
    await expect(pills).toHaveCount(6);
    await expect(pills.first().locator(".sp-rail-pcount")).toHaveText("27");
    // The honest counter starts at today, past the p24 proof entry → 24.
    await expect(rail.locator("#sp-rail-c-named")).toHaveText("24");
    await expect(rail.locator("#sp-rail-c-year")).toHaveText("2026");
  });

  test("ko: a filter pill collapses the other entries and recounts the status", async ({ page }) => {
    await page.goto("/ko/company/story");
    const rail = page.locator(".sp-rail");
    const productPill = rail.locator('.sp-rail-pill[data-sp-filter="product"]');
    await productPill.click();

    await expect(productPill).toHaveAttribute("aria-pressed", "true");
    await expect(rail.locator('.sp-rail-pill[data-sp-filter="all"]')).toHaveAttribute("aria-pressed", "false");
    // 4 product entries: BrainArch, SkinArch, the product-line split, WIZ.
    await expect(rail.locator("#sp-rail-status")).toHaveText("4개 항목 표시 · 최신순");
    await expect(rail.locator(".sp-rail-entry:visible")).toHaveCount(4, { timeout: 5_000 });
  });

  test("ko: Home/End scrub to the ends and the counters read the position honestly", async ({ page }) => {
    await page.goto("/ko/company/story");
    const rail = page.locator(".sp-rail");
    const range = rail.locator("#sp-rail-range");
    await range.focus();

    await range.press("Home");
    await expect(rail.locator("#sp-rail-reading")).toHaveText("2022-01");
    // Before any project entry, the honest counter shows 0 — the 24 total
    // only appears once the 2026 proof entry that confirms it is passed.
    await expect(rail.locator("#sp-rail-c-named")).toHaveText("0", { timeout: 5_000 });
    await expect(rail.locator("#sp-rail-c-year")).toHaveText("2022");

    await range.press("End");
    await expect(rail.locator("#sp-rail-reading")).toHaveText("2026-09");
    await expect(rail.locator("#sp-rail-c-named")).toHaveText("24", { timeout: 5_000 });
  });

  test("ko: dragging the range keeps aria-valuetext on the snapped entry's own date", async ({ page }) => {
    await page.goto("/ko/company/story");
    const range = page.locator("#sp-rail-range");
    // month index 54 = 2026-07 ≈ 2026.5 — snaps near the c. 2026 WIZ entry (2026.45).
    await range.fill("54");
    await expect(range).toHaveAttribute("aria-valuetext", /c\. 2026|2026-0\d/);
  });

  test("en: the rail translates its composed strings", async ({ page }) => {
    await page.goto("/en/company/story");
    const rail = page.locator(".sp-rail");
    await expect(rail.locator("#sp-rail-status")).toHaveText("27 entries shown · newest first");
    await expect(rail.locator(".sp-rail-today-label")).toHaveText("Today 2026-09");
    await expect(rail.getByRole("heading", { name: "Team · 23 people" })).toBeVisible();
  });
});
