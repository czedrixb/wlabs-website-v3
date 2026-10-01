import { test, expect } from "@playwright/test";
import path from "path";

// WOS-336 follow-up: the standalone /blog listing page is deleted — its
// posts now render inside the Company > Insights panel (NewsList.tsx),
// alongside that panel's 5 hardcoded news/product/case items, as a 4th
// "blog" kind with its own filter chip. Detail pages (/blog/[slug]) are
// unaffected and unchanged in URL. See:
//  - src/lib/site/content.ts (InsightKind/InsightLink widened)
//  - src/components/site/company/NewsList.tsx (the "blog" filter + link label)
//  - src/app/(frontend)/[locale]/(site)/company/[panel]/page.tsx (fetches posts)
//  - next.config.ts (permanent /blog -> /company/insights redirect)

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";
const SEEDED_SLUG = "publishing-workflow-for-editors";
const SEEDED_TITLE_KO = "편집자를 위한 발행 워크플로우";
const SEEDED_TITLE_EN = "Publishing Workflow for Editors";

test.describe("blog listing removal: /blog redirects", () => {
  test("/ko/blog issues a permanent redirect to /ko/company/insights", async ({ request }) => {
    const res = await request.get("/ko/blog", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/\/ko\/company\/insights$/);
  });

  test("/en/blog issues a permanent redirect to /en/company/insights", async ({ request }) => {
    const res = await request.get("/en/blog", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/\/en\/company\/insights$/);
  });

  test("following the redirect in a browser lands on a working insights panel", async ({ page }) => {
    await page.goto("/ko/blog");
    await expect(page).toHaveURL(/\/ko\/company\/insights$/);
    await expect(page.locator(".news-item").first()).toBeVisible();
  });
});

test.describe("insights panel: posts folded in as a 4th group", () => {
  test("the panel shows the 5 hardcoded items plus the seeded posts", async ({ page }) => {
    await page.goto("/ko/company/insights");

    const staticItems = page.locator(
      '.news-item[data-kind="news"], .news-item[data-kind="product"], .news-item[data-kind="case"]',
    );
    await expect(staticItems).toHaveCount(5);

    const postItems = page.locator('.news-item[data-kind="blog"]');
    await expect(postItems.first()).toBeVisible();
    // Seed data ships 3 published posts (2 drafts stay invisible).
    expect(await postItems.count()).toBeGreaterThanOrEqual(3);
    await expect(
      page.locator('.news-item[data-kind="blog"]', { hasText: SEEDED_TITLE_KO }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "insights-panel-ko.png"),
      fullPage: false,
    });
  });

  test("the 블로그 filter chip narrows to posts only; 회사 소식 still shows the 3 static news items", async ({
    page,
  }) => {
    await page.goto("/ko/company/insights");

    // Filtering is a full re-render (NewsList filters the array before
    // mapping, no [hidden] attribute involved) — so "narrowed" means the
    // total .news-item count drops to just the matching kind.
    await page.locator(".filters-track").getByRole("button", { name: "블로그", exact: true }).click();
    const blogCount = await page.locator('.news-item[data-kind="blog"]').count();
    expect(blogCount).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".news-item")).toHaveCount(blogCount);

    await page.locator(".filters-track").getByRole("button", { name: "회사 소식" }).click();
    await expect(page.locator(".news-item")).toHaveCount(3);
    for (const item of await page.locator(".news-item").all()) {
      await expect(item).toHaveAttribute("data-kind", "news");
    }
  });

  test("a post card's read-post link opens the real /blog/[slug] article", async ({ page }) => {
    await page.goto("/ko/company/insights");

    const postCard = page.locator('.news-item[data-kind="blog"]', { hasText: SEEDED_TITLE_KO });
    await expect(postCard.getByRole("link")).toHaveText(/글 읽기/);
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(new RegExp(`/ko/blog/${SEEDED_SLUG}$`));
    await expect(page.getByRole("heading", { name: SEEDED_TITLE_KO })).toBeVisible();
    await expect(page.locator("article.post-body")).toContainText("이메일과 비밀번호로 로그인하여");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "post-detail-ko.png"),
      fullPage: false,
    });
  });

  test("/en/company/insights shows English post titles and links to the English article", async ({
    page,
  }) => {
    await page.goto("/en/company/insights");

    const postCard = page.locator('.news-item[data-kind="blog"]', { hasText: SEEDED_TITLE_EN });
    await expect(postCard).toBeVisible();
    await expect(postCard.getByRole("link")).toHaveText(/Read post/);
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(new RegExp(`/en/blog/${SEEDED_SLUG}$`));
    await expect(page.getByRole("heading", { name: SEEDED_TITLE_EN })).toBeVisible();
    await expect(page.locator("article.post-body")).toContainText(
      "Editors log in with email and password",
    );
  });
});

test.describe("nav/footer no longer link to a standalone blog", () => {
  test("header nav has no Blog item", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/ko/work/services");
    await expect(page.locator(".header nav a", { hasText: "블로그" })).toHaveCount(0);
  });

  test("footer sitemap has no Blog link, only Insights", async ({ page }) => {
    await page.goto("/ko/work/services");
    const footer = page.locator("footer .sitemap");
    await expect(footer.locator("a", { hasText: "블로그" })).toHaveCount(0);
    await expect(footer.locator('a[href="/ko/company/insights"]')).toBeVisible();
  });
});
