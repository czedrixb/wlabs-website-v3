import { test, expect } from "@playwright/test";
import path from "path";

// WOS-329 DB resilience: posts are served through unstable_cache
// (src/lib/cachedPosts.ts). Two different fallback paths exist now that
// the /blog listing is gone: the Company > Insights panel
// (company/[panel]/page.tsx) catches a getPostsPage failure and silently
// falls back to its own hardcoded items — (site) has no error boundary of
// its own — while /blog/[slug] detail pages still let a getPostBySlug
// failure bubble up to (blog)/error.tsx, which replaces Next's raw
// production 500.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";
// A second `next start` of the same build, pointed at an unreachable
// DATABASE_URI — set by the runner; the boundary tests below are skipped
// without it. Only its origin is used below, so any path on that server
// works as the env var's value.
const DB_DOWN_URL = process.env.E2E_DB_DOWN_URL;
const DB_DOWN_ORIGIN = DB_DOWN_URL ? new URL(DB_DOWN_URL).origin : undefined;

test.describe("posts served through the data cache", () => {
  test("insights panel renders the posts list", async ({ page }) => {
    await page.goto("/ko/company/insights");
    // Scoped to data-kind="blog" — unlike the old /blog listing, this
    // panel always has its 5 hardcoded .news-item cards regardless of
    // whether posts loaded, so a bare .news-item count wouldn't actually
    // exercise the DB-backed path.
    const items = page.locator('main .news-item[data-kind="blog"]');
    await expect(items.first()).toBeVisible({ timeout: 20_000 });
    expect(await items.count()).toBeGreaterThan(0);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "after-homepage.png"),
      fullPage: false,
    });
  });

  test("post detail renders through getPostBySlug", async ({ page }) => {
    await page.goto("/ko/company/insights");
    // Scoped to a known seeded post rather than .first() — other specs
    // (e.g. publish-toggle.spec.ts) publish their own throwaway posts with
    // no content, and an interrupted run can leave one behind ahead of
    // this one in getPostsPage's -publishedAt sort.
    const seededPost = page.locator('main .news-item[data-kind="blog"]', {
      hasText: "편집자를 위한 발행 워크플로우",
    });
    const postLink = seededPost.getByRole("link");
    await expect(postLink).toBeVisible({ timeout: 20_000 });
    await postLink.click();
    await expect(page).toHaveURL(/\/ko\/blog\//);
    await expect(page.locator("article")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("when Postgres is down", () => {
  test.skip(!DB_DOWN_URL, "E2E_DB_DOWN_URL not set");

  test("a previously cached page still renders", async ({ page }) => {
    // The DB-down server shares .next (and so the data cache) with the
    // healthy one — a page cached before the outage keeps working through
    // it.
    await page.goto(`${DB_DOWN_ORIGIN}/ko/company/insights`, { timeout: 60_000 });
    await expect(page.locator("main .news-item").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("an uncached post detail shows the friendly retry page instead of a raw 500", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // The insights panel's own getPostsPage(1) call is guarded (falls back
    // to static items silently — company/[panel]/page.tsx), so it can no
    // longer force-exercise (blog)/error.tsx the way the old /blog
    // listing's ?page=97 did. A slug that's never been requested misses
    // getPostBySlug's cache instead and hits the unreachable DB directly.
    await page.goto(`${DB_DOWN_ORIGIN}/ko/blog/never-requested-${Date.now()}`, {
      timeout: 90_000,
    });
    await expect(
      page.getByRole("heading", { name: "일시적인 오류가 발생했습니다" }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole("button", { name: /다시 시도/ }),
    ).toBeVisible();
    // Next's default production error page must NOT be what renders.
    await expect(page.getByText("A server error occurred")).toHaveCount(0);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "after-error-boundary.png"),
      fullPage: false,
    });
  });
});
