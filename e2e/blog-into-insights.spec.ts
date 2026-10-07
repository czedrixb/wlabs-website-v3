import { test, expect } from "@playwright/test";
import path from "path";

// WOS-336 follow-up, reworked by WOS-342: the standalone /blog listing is
// gone (308 → /company/insights) and the detail pages moved from
// /blog/[slug] to /insights/[slug] (their own 308). The panel now renders
// the union of the six static v3 articles and the CMS posts, all carrying
// the news/notes/research taxonomy — the old "blog" chip is gone. See:
//  - src/lib/site/insightArticles.ts / insightsIndex.ts (the union)
//  - src/components/site/company/InsightsList.tsx (filters + pager)
//  - next.config.ts (both permanent redirects)

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";
const SEEDED_SLUG = "publishing-workflow-for-editors";
const SEEDED_TITLE_KO = "편집자를 위한 발행 워크플로우";
const SEEDED_TITLE_EN = "Publishing Workflow for Editors";

test.describe("blog removal: /blog redirects", () => {
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

  test("/ko/blog/[slug] issues a permanent redirect to /ko/insights/[slug] (WOS-342)", async ({
    request,
  }) => {
    const res = await request.get(`/ko/blog/${SEEDED_SLUG}`, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(new RegExp(`/ko/insights/${SEEDED_SLUG}$`));
  });

  test("the legacy /posts/[slug] redirect points straight at /ko/insights (no 308 chain)", async ({
    request,
  }) => {
    const res = await request.get(`/posts/${SEEDED_SLUG}`, { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(new RegExp(`/ko/insights/${SEEDED_SLUG}$`));
  });

  test("following the redirect in a browser lands on a working insights panel", async ({ page }) => {
    await page.goto("/ko/blog");
    await expect(page).toHaveURL(/\/ko\/company\/insights$/);
    await expect(page.locator(".insights-item").first()).toBeVisible();
  });
});

test.describe("insights panel: static articles + posts, one taxonomy", () => {
  test("page 1 shows the six newest entries (posts interleaved) and a pager", async ({ page }) => {
    await page.goto("/ko/company/insights");

    // 6 static articles + 3 seeded published posts = 9 entries, paged six
    // at a time — page 1 is exactly 6 cards, newest first, which puts the
    // freshly-seeded posts (published days ago) above the static articles
    // (2026-09 and older).
    await expect(page.locator(".insights-item")).toHaveCount(6);
    await expect(page.locator(".insights-item", { hasText: SEEDED_TITLE_KO })).toBeVisible();

    // Real pages only in the pager: ← 1 2 →, no ghost numbers.
    const pager = page.locator(".ins-pager");
    await expect(pager.locator(".pg.num")).toHaveCount(2);
    await expect(pager.locator('.pg[aria-current="page"]')).toHaveText("1");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "insights-panel-ko.png"),
      fullPage: false,
    });
  });

  test("the last page holds the oldest static article", async ({ page }) => {
    await page.goto("/ko/company/insights");
    // Stray published posts from other specs can shift the page count, so
    // target the LAST page rather than a literal "2" — ins-5 (2023) is the
    // oldest entry whatever else exists.
    const lastNum = page.locator(".ins-pager .pg.num").last();
    const label = await lastNum.textContent();
    await lastNum.click();
    await expect(page.locator(".ins-pager .pg[aria-current='page']")).toHaveText(label ?? "2");
    await expect(page.locator(".insights-item#ins-5")).toBeVisible();
    // The next-arrow is disabled at the end of the run.
    await expect(page.locator(".ins-pager .pg.arw").last()).toBeDisabled();
  });

  test("the 리서치 chip narrows to research-tagged entries; 전체 restores", async ({ page }) => {
    await page.goto("/ko/company/insights");

    await page.locator(".filters-track").getByRole("button", { name: "리서치", exact: true }).click();
    // ins-6 is the one research-tagged static; posts may add more only if
    // tagged research — every visible card must carry the kind.
    const cards = page.locator(".insights-item");
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    for (const item of await cards.all()) {
      const kinds = ((await item.getAttribute("data-kind")) ?? "").split(" ");
      expect(kinds).toContain("research");
    }
    await expect(page.locator(".insights-item#ins-6")).toBeVisible();

    await page.locator(".filters-track").getByRole("button", { name: "전체", exact: true }).click();
    await expect(page.locator(".insights-item")).toHaveCount(6);
  });

  test("every card shares one height, even when a post's excerpt is very long", async ({
    page,
    baseURL,
  }) => {
    // Prod regression (WOS-342 follow-up): a CMS post with a ~20-line
    // excerpt stretched its whole grid row to 2.2× the next row. The fix is
    // a 4-line excerpt clamp + grid-auto-rows:1fr, so this creates the same
    // runaway post and asserts the grid stays uniform.
    test.setTimeout(120_000);
    const api = page.context().request;
    const origin = { Origin: baseURL! };
    const SLUG = "e2e-wos342-long-excerpt";

    const stale = await (
      await api.get(`/api/posts?where[slug][equals]=${SLUG}&depth=0`, { headers: origin })
    ).json();
    for (const doc of stale.docs ?? []) {
      await api.delete(`/api/posts/${doc.id}`, { headers: origin });
    }

    const postRes = await api.post("/api/posts", {
      headers: origin,
      data: {
        title: "아주 긴 요약을 가진 회귀 테스트 글",
        slug: SLUG,
        excerpt:
          "대장내시경 검사에서 용종의 상당수가 발견되지 않는다는 문제의식에서 출발한 긴 요약입니다. ".repeat(12),
        _status: "published",
      },
    });
    expect(postRes.ok()).toBe(true);
    const postId = (await postRes.json()).doc.id;

    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      // The panel is ISR-cached (revalidate 60) — the afterChange tag
      // invalidation can take a request or two to reach the route, so
      // reload until the new card is on page 1 (it sorts newest).
      const card = page.locator(".insights-item", { hasText: "아주 긴 요약을 가진" });
      await expect(async () => {
        await page.goto("/ko/company/insights");
        await expect(card).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 90_000, intervals: [2_000] });

      // Its excerpt really is clamped (the text overflows the box) …
      expect(
        await card.locator("> div > p").evaluate((el) => el.scrollHeight > el.clientHeight + 1),
      ).toBe(true);

      // … and every visible card renders at one height (±1px).
      const heights = await page
        .locator(".insights-item")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length).toBe(6);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    } finally {
      await api.delete(`/api/posts/${postId}`, { headers: origin });
    }
  });

  test("the old 블로그 chip is gone; the taxonomy is 전체/뉴스/노트/리서치", async ({ page }) => {
    await page.goto("/ko/company/insights");
    const chips = page.locator(".filters-track button");
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(0)).toHaveText("전체");
    await expect(chips.nth(1)).toHaveText("뉴스");
    await expect(chips.nth(2)).toHaveText("노트");
    await expect(chips.nth(3)).toHaveText("리서치");
  });

  test("a post card's read link opens the real /insights/[slug] article", async ({ page }) => {
    await page.goto("/ko/company/insights");

    const postCard = page.locator(".insights-item", { hasText: SEEDED_TITLE_KO });
    await expect(postCard.getByRole("link")).toHaveText(/글 읽기/);
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(new RegExp(`/ko/insights/${SEEDED_SLUG}$`));
    // The article renders under the navy hero now (WOS-342).
    await expect(page.locator(".ins-hero h1")).toHaveText(SEEDED_TITLE_KO);
    await expect(page.locator("article.post-body")).toContainText("이메일과 비밀번호로 로그인하여");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "post-detail-ko.png"),
      fullPage: false,
    });
  });

  test("/en/company/insights shows English titles and links to the English article", async ({
    page,
  }) => {
    await page.goto("/en/company/insights");

    const postCard = page.locator(".insights-item", { hasText: SEEDED_TITLE_EN });
    await expect(postCard).toBeVisible();
    await expect(postCard.getByRole("link")).toHaveText(/Read the article/);
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(new RegExp(`/en/insights/${SEEDED_SLUG}$`));
    await expect(page.locator(".ins-hero h1")).toHaveText(SEEDED_TITLE_EN);
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
