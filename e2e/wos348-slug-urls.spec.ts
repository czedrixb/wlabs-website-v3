import { test, expect } from "@playwright/test";
import path from "path";

// WOS-348: the AISEN `slug` is the canonical URL identifier for a blog post
// — never an internal id — and a descriptive slug authored in AISEN must
// surface across every link generator without code changes. The fixtures
// carry one such post: ko "에이전트-러닝-전략" ↔ en "agentic-learning-strategy"
// (cross-linked via `translations`), dated 2025-06 so it sits mid-sequence
// (ins-5 stays the oldest for wos342-insights.spec.ts) and off the ko
// listing's page 1 (aisen-insights.spec.ts pins that page's six cards).
// Share popup mechanics stay covered by wos343-share-og.spec.ts — here we
// assert the URL the share row carries, plus the copy-link payload.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";

const KO_SLUG = "에이전트-러닝-전략";
const KO_ENC = encodeURIComponent(KO_SLUG); // what every generator must emit
const EN_SLUG = "agentic-learning-strategy";

// Records clipboard writes so the copy button's payload can be asserted
// without Playwright clipboard permissions.
async function stubClipboard(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __copied: string[] };
    w.__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (t: string) => {
          w.__copied.push(t);
          return Promise.resolve();
        },
      },
    });
  });
}

test.describe("share carries the slug URL (WOS-348 regression of the WOS-343 row)", () => {
  test("Facebook/LinkedIn hrefs and the copy button all carry the slug-based URL", async ({
    page,
    baseURL,
  }) => {
    await stubClipboard(page);
    await page.goto("/ko/insights/ins-1");

    const origin = new URL(baseURL!).origin;
    const shareUrl = `${origin}/ko/insights/ins-1`;
    const foot = page.locator(".ins-foot");

    await expect(foot.locator('a.sh[href*="facebook.com/sharer"]')).toHaveAttribute(
      "href",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    );
    await expect(foot.locator('a.sh[href*="linkedin.com"]')).toHaveAttribute(
      "href",
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    );

    const copyBtn = foot.locator("button.sh");
    await copyBtn.click();
    await expect(copyBtn).toHaveClass(/done/);
    const copied = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);
    expect(copied).toEqual([shareUrl]);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos348-share-row.png"),
      clip: (await foot.boundingBox()) ?? undefined,
    });
  });
});

test.describe("a descriptive AISEN slug surfaces everywhere, percent-encoded", () => {
  test("detail page: canonical, og:url, hreflang, share and copy all use the encoded slug", async ({
    page,
    baseURL,
  }) => {
    await stubClipboard(page);
    await page.goto(`/ko/insights/${KO_ENC}`);

    const origin = new URL(baseURL!).origin;
    const koUrl = `${origin}/ko/insights/${KO_ENC}`;

    await expect(page.locator(".ins-hero h1")).toHaveText("에이전트 러닝 전략");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", koUrl);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", koUrl);
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute(
      "href",
      koUrl,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      `${origin}/en/insights/${EN_SLUG}`,
    );

    const foot = page.locator(".ins-foot");
    await expect(foot.locator('a.sh[href*="facebook.com/sharer"]')).toHaveAttribute(
      "href",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(koUrl)}`,
    );
    const copyBtn = foot.locator("button.sh");
    await copyBtn.click();
    const copied = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);
    expect(copied).toEqual([koUrl]);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos348-descriptive-slug-article.png"),
      fullPage: false,
    });
  });

  test("language switch goes slug→slug in both directions via translations[]", async ({
    page,
  }) => {
    await page.goto(`/ko/insights/${KO_ENC}`);
    const sw = page.locator(".ins-foot .ins-lang");
    await expect(sw).toHaveAttribute("href", `/en/insights/${EN_SLUG}`);
    await sw.click();
    await expect(page.locator(".ins-hero h1")).toHaveText("An Agentic Learning Strategy");
    // Back-link carries the Korean slug, percent-encoded.
    await expect(page.locator(".ins-foot .ins-lang")).toHaveAttribute(
      "href",
      `/ko/insights/${KO_ENC}`,
    );
    // The floating toggle gets the same explicit target.
    await expect(page.locator('.lang-float a[lang="ko"]')).toHaveAttribute(
      "href",
      `/ko/insights/${KO_ENC}`,
    );
  });

  test("prev/next: ins-5's newer neighbour links to the encoded descriptive slug", async ({
    page,
  }) => {
    // 2025-06 sits directly above ins-5 (2023) in the shared date order.
    await page.goto("/ko/insights/ins-5");
    await expect(page.locator(".ins-nav a.pv")).toHaveAttribute(
      "href",
      `/ko/insights/${KO_ENC}`,
    );
  });

  test("listing card (page 2) links to the encoded descriptive slug", async ({ page }) => {
    await page.goto("/ko/company/insights");
    await page.locator(".ins-pager button", { hasText: "2" }).click();
    const item = page.locator(`.insights-item[id="${KO_SLUG}"]`);
    await expect(item).toBeVisible();
    await expect(item.locator("a.read")).toHaveAttribute("href", `/ko/insights/${KO_ENC}`);
  });

  test("sitemap and RSS emit the encoded slug URL", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`/ko/insights/${KO_ENC}`);
    expect(xml).toContain(`/en/insights/${EN_SLUG}`);
    // The raw (unencoded) form must not appear in any URL.
    expect(xml).not.toContain(`/ko/insights/${KO_SLUG}`);

    const rss = await (await request.get("/ko/rss.xml")).text();
    expect(rss).toContain(`/ko/insights/${KO_ENC}`);
    expect(rss).not.toContain(`/ko/insights/${KO_SLUG}`);
  });
});
