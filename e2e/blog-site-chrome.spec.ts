import { test, expect, devices } from "@playwright/test";

// WOS-335: the blog now wraps its pages in the same <SiteChrome> as every
// (site) route (Header/Masthead/TabBar/Footer/LangToggle) and renders on
// site.css's v3 tokens instead of its own Tailwind stylesheet — see
// src/components/site/chrome/SiteChrome.tsx. This only covers the
// chrome/discoverability surface WOS-335 adds; site-shell.spec.ts already
// covers the same components' behavior on (site) routes, and
// public-list-and-detail.spec.ts / locale-toggle.spec.ts cover the blog's
// own reading flow.

const SEEDED_SLUG = "publishing-workflow-for-editors";

test.describe("blog chrome: desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of [`/ko/blog`, `/ko/blog/${SEEDED_SLUG}`]) {
    test(`${path}: site header visible, masthead/tab bar hidden`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("header.header")).toBeVisible();
      await expect(page.locator(".sp-mhead")).toBeHidden();
      await expect(page.locator(".tabbar")).toBeHidden();
      await expect(page.locator("footer .sitemap")).toBeVisible();
    });
  }

  test("the Blog nav link carries aria-current on both the list and a post", async ({ page }) => {
    await page.goto("/ko/blog");
    await expect(page.locator('.header nav a[aria-current="page"]')).toHaveText("블로그");

    await page.goto(`/ko/blog/${SEEDED_SLUG}`);
    await expect(page.locator('.header nav a[aria-current="page"]')).toHaveText("블로그");
  });
});

test.describe("blog chrome: mobile (393px)", () => {
  test.use({ viewport: devices["iPhone 13"].viewport });

  test("masthead and tab bar are visible, desktop header is not", async ({ page }) => {
    await page.goto("/ko/blog");
    await expect(page.locator(".sp-mhead")).toBeVisible();
    await expect(page.locator(".tabbar")).toBeVisible();
    await expect(page.locator("header.header")).toBeHidden();
  });
});

test.describe("blog chrome: v3 tokens, not Tailwind", () => {
  test("renders on site.css's tokens, not Tailwind's white/system-font default", async ({ page }) => {
    await page.goto("/ko/blog");
    // The base --cream token (site.css's top :root) is itself overridden by
    // the "08 Depth" layer further down the file (~line 1794) to #F4F7F9,
    // and that layer also repaints `body` with a hardcoded gradient wash
    // instead of `var(--cream)` — true of every (site) page too (verified
    // against /ko/work/services), not something this ticket introduced.
    // Reading the custom property directly is what actually pins "site.css
    // loaded here", independent of which layer last touched `body`.
    const cream = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--cream").trim(),
    );
    expect(cream.toLowerCase()).toBe("#f4f7f9");

    // Tailwind's globals.css set a flat #ffffff/#0a0a0a via
    // prefers-color-scheme — gone now, replaced by this gradient wash.
    const bgImage = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(bgImage).toContain("gradient");
  });
});

test.describe("blog chrome: language toggle", () => {
  test("the shared lang-float pill switches locale from the blog list", async ({ page }) => {
    await page.goto("/ko/blog");
    await page.locator(".lang-float a[lang='en']").click();
    await expect(page).toHaveURL(/\/en\/blog$/);
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("blog chrome: discoverability from the site", () => {
  test("the footer sitemap links to the blog, in both locales", async ({ page }) => {
    await page.goto("/ko/work/services");
    await page.locator("footer .sitemap a", { hasText: "블로그" }).click();
    await expect(page).toHaveURL(/\/ko\/blog$/);

    await page.goto("/en/work/services");
    await page.locator("footer .sitemap a", { hasText: "Blog" }).click();
    await expect(page).toHaveURL(/\/en\/blog$/);
  });

  test("the header nav links to the blog from a site page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/ko/work/services");
    await page.locator(".header nav a", { hasText: "블로그" }).click();
    await expect(page).toHaveURL(/\/ko\/blog$/);
  });
});

test.describe("blog post body", () => {
  test("renders inside an .post-body article with the seeded Korean content", async ({ page }) => {
    await page.goto(`/ko/blog/${SEEDED_SLUG}`);
    const body = page.locator("article.post-body");
    await expect(body).toBeVisible();
    await expect(body).toContainText("이메일과 비밀번호로 로그인하여");
  });
});
