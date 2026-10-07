import { test, expect } from "@playwright/test";
import path from "path";

// WOS-342: the v3 Insights rebuild (v3 commit 2021e81) ported into the
// site — the listing's glass cards / taxonomy / pager are covered in
// blog-into-insights.spec.ts; this spec covers the new article single page
// (/insights/[slug]): the navy hero with its photo/mark shot treatments,
// the sticky figure rail + lightbox, sources, byline + share, date-ordered
// prev/next, the related rail, and the styled 404. Static articles
// (ins-1…ins-6, src/lib/site/insightArticles.ts) are deterministic; post-
// dependent assertions stick to the seeded slugs.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";

test.describe("insight article: static (ins-1, mark shot)", () => {
  test("hero renders crumbs, category pill, title, dek, date — and the scix mark", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-1");

    const hero = page.locator(".ins-hero.has-shot");
    await expect(hero).toBeVisible();
    // The Science Exchange asset is a logo — a plated corner mark, not a
    // bleeding photograph.
    await expect(hero.locator(".ins-shot.is-mark")).toBeAttached();

    await expect(hero.locator(".crumbs a").nth(0)).toHaveText("회사");
    await expect(hero.locator(".crumbs a").nth(1)).toHaveText("인사이트");
    await expect(hero.locator(".ins-cats .c")).toHaveText(["노트"]);
    await expect(hero.locator("h1")).toContainText("Science Exchange");
    await expect(hero.locator(".ins-dek")).toBeVisible();
    await expect(hero.locator(".ins-meta")).toHaveText("2026 · 03");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos342-article-ins-1.png"),
      fullPage: false,
    });
  });

  test("body: standfirst on the first paragraph, sources with external arrow", async ({ page }) => {
    await page.goto("/ko/insights/ins-1");

    await expect(page.locator(".ins-prose p").first()).toHaveClass(/stand/);

    const src = page.locator(".ins-src");
    await expect(src.locator("h3")).toHaveText("출처");
    await expect(src.locator("li")).toHaveCount(2);
    const ext = src.locator('a[href="https://www.scienceexchange.com"]');
    await expect(ext).toContainText("↗");
    await expect(ext).toHaveAttribute("target", "_blank");
  });

  test("byline + share: facebook/linkedin sharers carry the page URL, copy rings done", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/ko/insights/ins-1");

    const foot = page.locator(".ins-foot");
    await expect(foot.locator(".ins-by b")).toHaveText("W Labs");

    const pageUrl = encodeURIComponent(`${new URL(baseURL!).origin}/ko/insights/ins-1`);
    await expect(foot.locator('a.sh[href*="facebook.com/sharer"]')).toHaveAttribute(
      "href",
      new RegExp(pageUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    await expect(foot.locator('a.sh[href*="linkedin.com"]')).toBeVisible();

    await context_grantClipboard(page);
    const copyBtn = foot.locator("button.sh");
    await copyBtn.click();
    await expect(copyBtn).toHaveClass(/done/);
    // The teal ring clears again after two seconds.
    await expect(copyBtn).not.toHaveClass(/done/, { timeout: 5_000 });
  });

  test("related rail shows three cards, none of them the article itself", async ({ page }) => {
    await page.goto("/ko/insights/ins-1");
    const cards = page.locator(".ins-more .ins-card");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      expect(await card.getAttribute("href")).not.toMatch(/\/insights\/ins-1$/);
    }
  });
});

test.describe("insight article: figure rail + lightbox (ins-4)", () => {
  test("the rail holds two expandable figures; the hero carries a photo shot", async ({ page }) => {
    await page.goto("/ko/insights/ins-4");

    // Photo treatment, not a mark.
    await expect(page.locator(".ins-hero .ins-shot:not(.is-mark)")).toBeAttached();
    await expect(page.locator(".ins-figs .ins-fig")).toHaveCount(2);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos342-article-ins-4.png"),
      fullPage: false,
    });
  });

  test("a figure expands into the lightbox; Escape closes and returns focus", async ({ page }) => {
    await page.goto("/ko/insights/ins-4");

    const firstBtn = page.locator(".ins-figs .ins-fig-btn").first();
    await firstBtn.click();

    const lbox = page.locator(".lbox");
    await expect(lbox).toBeVisible();
    await expect(lbox.locator("img")).toBeVisible();
    await expect(lbox.locator("figcaption")).not.toBeEmpty();
    // The close button takes focus on open.
    await expect(lbox.locator(".lbox-close")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(lbox).toHaveCount(0);
    await expect(firstBtn).toBeFocused();
  });
});

test.describe("insight article: prev/next on the shared date order", () => {
  test("the oldest article's next cell is the 'nothing further' placeholder", async ({ page }) => {
    // ins-5 (2023) is the oldest entry whatever posts exist, so its nx cell
    // is deterministically the dimmed placeholder and its pv a real link.
    await page.goto("/ko/insights/ins-5");
    const nav = page.locator(".ins-nav");
    await expect(nav.locator("a.pv")).toBeVisible();
    const ph = nav.locator(".ins-ph.nx");
    await expect(ph).toBeVisible();
    await expect(ph).toContainText("더 이상 없습니다");
  });

  test("a mid-sequence article links both ways", async ({ page }) => {
    await page.goto("/ko/insights/ins-1");
    const nav = page.locator(".ins-nav");
    await expect(nav.locator("a.pv .l")).toHaveText("이전 · 최신");
    await expect(nav.locator("a.nx .l")).toHaveText("다음 · 이전 글");
    await nav.locator("a.nx").click();
    await expect(page).toHaveURL(/\/ko\/insights\//);
    await expect(page.locator(".ins-hero h1")).toBeVisible();
  });
});

test.describe("insight article: CMS post through the same shell", () => {
  test("a seeded post renders hero + RichText body + author byline", async ({ page }) => {
    await page.goto("/ko/insights/publishing-workflow-for-editors");

    const hero = page.locator(".ins-hero");
    await expect(hero.locator("h1")).toHaveText("편집자를 위한 발행 워크플로우");
    // Date-only meta, "YYYY · MM" — no author/reading time in the hero.
    await expect(hero.locator(".ins-meta")).toHaveText(/^\d{4} · \d{2}$/);

    await expect(page.locator(".ins-prose article.post-body")).toContainText(
      "이메일과 비밀번호로 로그인하여",
    );
    await expect(page.locator(".ins-by b")).toHaveText("W Labs Editor");
    // Prev/next and related render for posts too.
    await expect(page.locator(".ins-nav")).toBeVisible();
    await expect(page.locator(".ins-more .ins-card")).toHaveCount(3);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos342-article-post.png"),
      fullPage: false,
    });
  });
});

test.describe("insight article: english", () => {
  test("/en/insights/ins-1 renders the English article", async ({ page }) => {
    await page.goto("/en/insights/ins-1");
    await expect(page.locator(".ins-hero h1")).toHaveText(
      "W Labs is now a verified supplier on Science Exchange",
    );
    await expect(page.locator(".ins-cats .c")).toHaveText(["Notes"]);
    await expect(page.locator(".ins-src h3")).toHaveText("Sources");
    await expect(page.locator(".ins-by .l")).toHaveText("Written by");
  });
});

test.describe("insight 404: unknown slug says so instead of falling through", () => {
  test("HTTP 404 with the is-404 hero, the requested slug, and the latest three", async ({
    page,
  }) => {
    const res = await page.goto("/ko/insights/this-article-does-not-exist");
    expect(res?.status()).toBe(404);

    const hero = page.locator(".ins-hero.is-404");
    await expect(hero).toBeVisible();
    await expect(hero.locator(".ins-404-code")).toHaveText("404");
    await expect(hero.locator("h1")).toHaveText("요청하신 글을 찾을 수 없습니다.");
    await expect(hero.locator(".ins-meta code")).toHaveText("this-article-does-not-exist");

    const acts = page.locator(".ins-404-acts");
    await expect(acts.locator("a.btn-primary")).toContainText("인사이트 전체");
    await expect(acts.locator("a.btn-ghost")).toContainText("홈으로");

    await expect(page.locator(".ins-more h2")).toHaveText("최신 인사이트");
    await expect(page.locator(".ins-more .ins-card")).toHaveCount(3);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos342-article-404.png"),
      fullPage: false,
    });
  });

  test("the 404 reads in English under /en and routes back within /en", async ({ page }) => {
    const res = await page.goto("/en/insights/this-article-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.locator(".ins-hero.is-404 h1")).toHaveText("This article isn’t here.");
    await expect(page.locator(".ins-404-acts a.btn-primary")).toHaveAttribute(
      "href",
      "/en/company/insights",
    );
  });
});

// Chromium needs an explicit permission grant for clipboard writes under
// automation; Playwright exposes it per-context.
async function context_grantClipboard(page: import("@playwright/test").Page) {
  await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"])
    .catch(() => {
      // Non-Chromium projects don't support the grant — the component falls
      // back to execCommand and the done-state assertion still holds.
    });
}
