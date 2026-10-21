import { test, expect } from "@playwright/test";
import path from "path";

// WOS-342, reworked by WOS-346: the article single page (/insights/[slug])
// — the navy hero with its shot treatment, byline + share, date-ordered
// prev/next, the related rail, and the styled 404 — now serving AISEN Blog
// API posts (ins-1…ins-5, from the e2e stub's fixtures) and CMS posts
// through the same shell. The old static-article affordances (mark shots,
// the sources list, the standfirst class) left with insightArticles.ts;
// the figure rail + lightbox came back in WOS-347, fed by AISEN body images
// (split rail/inline per viewport — covered in wos347-figure-rail.spec.ts);
// AISEN-specific rendering (content_html body, SEO metadata, hreflang, the
// language switch) is covered in aisen-insights.spec.ts.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";

test.describe("insight article: AISEN post (ins-1)", () => {
  test("hero renders crumbs, category pill, title, dek, date — and the cover shot", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-1");

    const hero = page.locator(".ins-hero.has-shot");
    await expect(hero).toBeVisible();
    await expect(hero.locator(".ins-shot")).toBeAttached();

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

  test("the sanitised content_html body renders inside .post-body", async ({ page }) => {
    await page.goto("/ko/insights/ins-1");

    const body = page.locator(".ins-prose article.post-body");
    await expect(body).toContainText("Science Exchange는 제약·바이오 기업이");
    // The body carries the version's own language.
    await expect(body).toHaveAttribute("lang", "ko");
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

test.describe("insight article: body figures split between rail and prose (ins-4, WOS-347)", () => {
  test("the hero carries the cover; both body figures exist in the rail and inline", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-4");

    await expect(page.locator(".ins-hero .ins-shot")).toBeAttached();
    // The two content_html <img>s are wrapped into .ins-inline-fig (hidden at
    // this desktop viewport) and mirrored into the rail, which shows them.
    const body = page.locator(".ins-prose article.post-body");
    await expect(body.locator(".ins-inline-fig")).toHaveCount(2);
    await expect(page.locator(".ins-figs .ins-fig")).toHaveCount(2);
    await expect(body).toContainText("SkinArch");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos342-article-ins-4.png"),
      fullPage: false,
    });
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
