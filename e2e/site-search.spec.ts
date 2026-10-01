import { test, expect } from "@playwright/test";

// WOS-336: the real /search screen replacing the WOS-314 stub — v3's
// client-side index/scoring/keyboard behavior (site/index.html:3652-3686)
// and the rotating shortcut list. Covers the search screen only (per the
// global testing policy's "focus only on the changes").

test.describe("site search", () => {
  test("ko: renders the field and the five-shortcut list", async ({ page }) => {
    await page.goto("/ko/search");
    await expect(page.getByRole("heading", { name: "무엇을 찾고 계신가요?" })).toBeVisible();
    await expect(page.locator("#q")).toHaveAttribute("placeholder", "예: LC-OCT, 학사 관리, WIZ");
    await expect(page.locator("#q")).toBeFocused();
    await expect(page.locator("#search-shortcuts")).toBeVisible();
    await expect(page.locator("#search-shortcuts li")).toHaveCount(5);
    await expect(page.locator("#search-results")).toBeHidden();
  });

  test("ko: a one-character query shows the minimum-length hint", async ({ page }) => {
    await page.goto("/ko/search");
    await page.locator("#q").fill("김");
    await expect(page.locator("#search-results .hint")).toHaveText("두 글자 이상 입력해 주세요.");
    await expect(page.locator("#search-shortcuts")).toBeHidden();
  });

  test("ko: results are grouped by kind with highlighted matches", async ({ page }) => {
    await page.goto("/ko/search");
    await page.locator("#q").fill("SkinArch");

    const results = page.locator("#search-results");
    await expect(results.locator(".meta")).toContainText("개 결과");
    await expect(results.locator(".group h2").filter({ hasText: "제품" })).toBeVisible();
    const firstHit = results.locator(".hit").first();
    await expect(firstHit.locator("mark").first()).toContainText(/skinarch/i);
  });

  test("ko: glossary terms are searchable", async ({ page }) => {
    await page.goto("/ko/search");
    await page.locator("#q").fill("LC-OCT");
    await expect(page.locator("#search-results .group h2").filter({ hasText: "용어" })).toBeVisible();
  });

  test("ko: arrow keys select, Enter opens the selected hit", async ({ page }) => {
    await page.goto("/ko/search");
    const input = page.locator("#q");
    await input.fill("WIZ");
    await expect(page.locator("#search-results .hit").first()).toBeVisible();

    await input.press("ArrowDown");
    const selected = page.locator("#search-results .hit.sel");
    await expect(selected).toHaveCount(1);
    const href = await selected.getAttribute("href");
    await input.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${href!.split("#")[0].replace(/[/\\]/g, "\\$&")}`));
  });

  test("ko: no results offers the inquiry sheet and a work link", async ({ page }) => {
    await page.goto("/ko/search");
    await page.locator("#q").fill("zzzzqqqq");

    const empty = page.locator("#search-results .empty");
    await expect(empty.getByRole("heading", { name: /zzzzqqqq/ })).toBeVisible();
    await empty.locator('[data-contact="general"]').click();
    const sheet = page.locator("#sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.locator("#s-topic")).toHaveValue("general");
  });

  test("ko: Escape clears the query back to the shortcuts", async ({ page }) => {
    await page.goto("/ko/search");
    const input = page.locator("#q");
    await input.fill("WIZ");
    await expect(page.locator("#search-results")).toBeVisible();
    await input.press("Escape");
    await expect(page.locator("#search-shortcuts")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("en: the screen and results translate", async ({ page }) => {
    await page.goto("/en/search");
    await expect(page.getByRole("heading", { name: "What are you looking for?" })).toBeVisible();
    await page.locator("#q").fill("imaging");
    await expect(page.locator("#search-results .meta")).toContainText("results");
    await expect(page.locator("#search-results .group h2").first()).toBeVisible();
  });
});
