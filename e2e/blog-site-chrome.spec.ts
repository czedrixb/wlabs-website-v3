import { test, expect, devices } from "@playwright/test";

// WOS-335: the blog wraps its pages in the same <SiteChrome> as every
// (site) route (Header/Masthead/TabBar/Footer/LangToggle) and renders on
// site.css's v3 tokens instead of its own Tailwind stylesheet — see
// src/components/site/chrome/SiteChrome.tsx. A later pass deleted the
// /blog listing page itself (its posts now render inside Company >
// Insights — see e2e/blog-into-insights.spec.ts) and, with it, the
// top-level "Blog" nav/footer link; WOS-342 then moved the detail page to
// /insights/[slug], which is what's covered here now. site-shell.spec.ts
// already covers the same chrome components' behavior on (site) routes.

const SEEDED_SLUG = "publishing-workflow-for-editors";

test.describe("blog chrome: desktop (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test(`/ko/insights/${SEEDED_SLUG}: site header visible, masthead/tab bar hidden`, async ({ page }) => {
    await page.goto(`/ko/insights/${SEEDED_SLUG}`);
    await expect(page.locator("header.header")).toBeVisible();
    await expect(page.locator(".sp-mhead")).toBeHidden();
    await expect(page.locator(".tabbar")).toBeHidden();
    await expect(page.locator("footer .sitemap")).toBeVisible();
  });
});

test.describe("blog chrome: mobile (393px)", () => {
  test.use({ viewport: devices["iPhone 13"].viewport });

  test("masthead and tab bar are visible, desktop header is not", async ({ page }) => {
    await page.goto(`/ko/insights/${SEEDED_SLUG}`);
    await expect(page.locator(".sp-mhead")).toBeVisible();
    await expect(page.locator(".tabbar")).toBeVisible();
    await expect(page.locator("header.header")).toBeHidden();
  });
});

test.describe("blog chrome: v3 tokens, not Tailwind", () => {
  test("renders on site.css's tokens, not Tailwind's white/system-font default", async ({ page }) => {
    await page.goto(`/ko/insights/${SEEDED_SLUG}`);
    // The base --cream token (site.css's top :root) is itself overridden by
    // the "08 Depth" layer further down the file to #F4F7F9. Reading the
    // custom property directly is what actually pins "site.css loaded
    // here", independent of which layer last touched `body`.
    const cream = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--cream").trim(),
    );
    expect(cream.toLowerCase()).toBe("#f4f7f9");

    // Tailwind's globals.css set a flat #ffffff/#0a0a0a via
    // prefers-color-scheme — gone now. WOS-336 settled the ground on one
    // flat var(--cream) paint (site.css's "the paper is one flat, even
    // ground" rule) — the earlier Depth gradient wash this spec once
    // asserted was removed there, so the pin is the resolved token color.
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(244, 247, 249)"); // #F4F7F9
  });
});

test.describe("blog chrome: language toggle", () => {
  test("the shared lang-float pill switches locale on a post", async ({ page }) => {
    await page.goto(`/ko/insights/${SEEDED_SLUG}`);
    await page.locator(".lang-float a[lang='en']").click();
    await expect(page).toHaveURL(new RegExp(`/en/insights/${SEEDED_SLUG}$`));
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("blog post body", () => {
  test("renders inside an .post-body article with the seeded Korean content", async ({ page }) => {
    await page.goto(`/ko/insights/${SEEDED_SLUG}`);
    const body = page.locator("article.post-body");
    await expect(body).toBeVisible();
    await expect(body).toContainText("이메일과 비밀번호로 로그인하여");
  });
});
