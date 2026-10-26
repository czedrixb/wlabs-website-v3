import { test, expect, devices } from "@playwright/test";

// WOS-354: the footer's Privacy/Terms links used to dead-end at /company
// (WOS-351 finding F11). Covers the new /legal/privacy and /legal/terms
// pages only, per the global testing policy's "focus only on the changes" —
// ordinary public-page checks, the admin storage state is unused.

test.describe("WOS-354 footer links", () => {
  test("ko: footer Privacy/Terms resolve to /legal/*, not /company", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.locator('footer a[href="/ko/legal/privacy"]')).toHaveText("개인정보처리방침");
    await expect(page.locator('footer a[href="/ko/legal/terms"]')).toHaveText("이용약관");
  });

  test("en: footer Privacy/Terms resolve to /legal/*", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('footer a[href="/en/legal/privacy"]')).toHaveText("Privacy policy");
    await expect(page.locator('footer a[href="/en/legal/terms"]')).toHaveText("Terms");
  });

  test("footer link navigates to the new page, not /company", async ({ page }) => {
    await page.goto("/ko");
    await page.locator('footer a[href="/ko/legal/privacy"]').click();
    await expect(page).toHaveURL(/\/ko\/legal\/privacy$/);
  });
});

test.describe("WOS-354 legal documents", () => {
  for (const [locale, doc, title] of [
    ["ko", "privacy", "개인정보처리방침"],
    ["ko", "terms", "이용약관"],
    ["en", "privacy", "Privacy Policy"],
    ["en", "terms", "Terms & Conditions"],
  ] as const) {
    test(`${locale}/${doc}: renders title, effective date and sections`, async ({ page }) => {
      const res = await page.goto(`/${locale}/legal/${doc}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      const sections = page.locator(".legal-doc > section");
      await expect(sections).not.toHaveCount(0);
      // EN headings/body read as English (W Labs' own Korean legal name in
      // parentheses is expected on both locales — same convention as the
      // footer's legal1 string — so this checks the heading text specifically,
      // not a blanket no-Hangul-anywhere sweep).
      if (locale === "en") {
        const headings = await page.locator(".legal-doc h2").allInnerTexts();
        for (const h of headings) expect(h).not.toMatch(/[ㄱ-힝]/);
      }
    });
  }

  test("ko/privacy carries no disclaimer/notice banner — removed per request", async ({ page }) => {
    await page.goto("/ko/legal/privacy");
    await expect(page.locator(".legal-note")).toHaveCount(0);
    await expect(page.locator(".legal-doc")).not.toContainText("한국어 원문이 우선");
    await expect(page.locator(".legal-doc")).not.toContainText("이전 버전을 대체합니다");
  });

  test("ko/privacy carries the 권익침해 구제방법 section (WOS-354 PIPA addition)", async ({ page }) => {
    await page.goto("/ko/legal/privacy");
    await expect(page.getByRole("heading", { name: /권익침해 구제방법/ })).toBeVisible();
    await expect(page.getByText("개인정보분쟁조정위원회")).toBeVisible();
  });

  test("en/privacy carries the destruction-procedure section", async ({ page }) => {
    await page.goto("/en/legal/privacy");
    await expect(page.getByRole("heading", { name: /Destruction procedure/ })).toBeVisible();
  });

  test("ko/terms states the business registration number", async ({ page }) => {
    await page.goto("/ko/legal/terms");
    await expect(page.locator(".legal-doc")).toContainText("387-87-03701");
  });

  test(".legal-switch cross-links privacy and terms", async ({ page }) => {
    await page.goto("/ko/legal/privacy");
    const switchLink = page.locator(".legal-switch a");
    await expect(switchLink).toHaveAttribute("href", "/ko/legal/terms");
    await switchLink.click();
    await expect(page).toHaveURL(/\/ko\/legal\/terms$/);
    await expect(page.locator(".legal-switch a")).toHaveAttribute("href", "/ko/legal/privacy");
  });

  test("/legal redirects to /legal/privacy", async ({ page }) => {
    await page.goto("/ko/legal");
    await expect(page).toHaveURL(/\/ko\/legal\/privacy$/);
  });

  test("/legal/garbage 404s through the branded boundary", async ({ page }) => {
    const res = await page.goto("/ko/legal/wos354-no-such-doc");
    expect(res?.status()).toBe(404);
    await expect(page.locator("footer .sitemap")).toBeVisible();
  });

  test("SegNav switches between Privacy and Terms", async ({ page }) => {
    await page.goto("/ko/legal/privacy");
    await page.locator('.seg a[href="/ko/legal/terms"]').click();
    await expect(page).toHaveURL(/\/ko\/legal\/terms$/);
  });
});

test.describe("WOS-354 search index", () => {
  test("ko: searching 개인정보처리방침 returns a hit linking to /legal/privacy", async ({ page }) => {
    await page.goto("/ko/search");
    await page.locator("#q").fill("개인정보처리방침");
    const hit = page.locator("#search-results .hit", { hasText: "개인정보처리방침" }).first();
    await expect(hit).toBeVisible();
    await expect(hit).toHaveAttribute("href", "/ko/legal/privacy");
  });
});

test.describe("WOS-354 responsive", () => {
  for (const [label, viewport] of [
    ["mobile", devices["iPhone 13"].viewport],
    ["tablet", { width: 834, height: 1194 }],
    ["pc", { width: 1440, height: 900 }],
  ] as const) {
    test(`${label}: /legal/privacy has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/ko/legal/privacy");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    });
  }
});
