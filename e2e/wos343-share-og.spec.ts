import { test, expect } from "@playwright/test";
import path from "path";

// WOS-343: two defects found QA-ing WOS-342's Insights redesign in prod —
// (1) the Facebook/LinkedIn share buttons on an insight article navigated
// as a plain target="_blank" anchor, which for a Facebook-logged-in user
// bounces sharer.php to a blank facebook.com/share_channel/# page instead
// of the share dialog; (2) siteMetadata() (src/lib/site/metadata.ts), used
// by every route's generateMetadata, emitted zero Open Graph/Twitter Card
// tags, so even a correctly-opened dialog had no title/description/image to
// preview. Scoped to exactly those two fixes, per the global testing
// policy — not a general SEO or Insights regression sweep (see seo.spec.ts
// and wos342-insights.spec.ts for those).

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";

test.describe("share buttons open a popup, not a navigation", () => {
  test("clicking Facebook/LinkedIn calls window.open() with popup features; the page itself never navigates", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/ko/insights/ins-1");

    // Stub window.open before any app code runs, recording every call's
    // arguments and returning a dummy handle (so ShareRow treats it as a
    // successful popup and calls preventDefault — exactly the branch under
    // test). waitForEvent("popup") alone can't tell a real window.open()
    // call apart from a plain <a target="_blank"> navigation, which is
    // exactly the bug this regresses against.
    await page.addInitScript(() => {
      (window as unknown as { __shareOpenCalls: unknown[][] }).__shareOpenCalls = [];
      window.open = ((...args: unknown[]) => {
        (window as unknown as { __shareOpenCalls: unknown[][] }).__shareOpenCalls.push(args);
        return { focus() {} } as Window;
      }) as typeof window.open;
    });
    await page.reload();

    const foot = page.locator(".ins-foot");
    const pageUrl = encodeURIComponent(`${new URL(baseURL!).origin}/ko/insights/ins-1`);

    await foot.locator('a.sh[href*="facebook.com/sharer"]').click();
    const fbCalls = await page.evaluate(
      () => (window as unknown as { __shareOpenCalls: unknown[][] }).__shareOpenCalls,
    );
    expect(fbCalls).toHaveLength(1);
    expect(String(fbCalls[0][0])).toContain("facebook.com/sharer");
    expect(String(fbCalls[0][0])).toContain(pageUrl);
    expect(String(fbCalls[0][2])).toMatch(/popup/);
    expect(String(fbCalls[0][2])).toMatch(/width=/);
    // The click must NOT also navigate the current tab.
    await expect(page).toHaveURL(/\/ko\/insights\/ins-1$/);

    await foot.locator('a.sh[href*="linkedin.com"]').click();
    const liCalls = await page.evaluate(
      () => (window as unknown as { __shareOpenCalls: unknown[][] }).__shareOpenCalls,
    );
    expect(liCalls).toHaveLength(2);
    expect(String(liCalls[1][0])).toContain("linkedin.com");
    await expect(page).toHaveURL(/\/ko\/insights\/ins-1$/);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "wos343-share-row.png"),
      clip: (await foot.boundingBox()) ?? undefined,
    });
  });

  test("a popup-blocked click falls back to the anchor's own navigation instead of doing nothing", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-1");
    // Simulates a blocked popup: window.open resolves to null, same as a
    // real browser's popup blocker.
    await page.addInitScript(() => {
      window.open = (() => null) as unknown as typeof window.open;
    });
    await page.reload();

    const fb = page.locator('.ins-foot a.sh[href*="facebook.com/sharer"]');
    const href = await fb.getAttribute("href");
    expect(href).toBeTruthy();
    // Still a real, correctly-built anchor — target="_blank" carries the
    // click through when window.open can't.
    await expect(fb).toHaveAttribute("target", "_blank");
  });
});

test.describe("Open Graph + Twitter Card — site-wide, not just Insights", () => {
  async function ogTags(page: import("@playwright/test").Page) {
    return page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map((m) => [
          m.getAttribute("property") ?? m.getAttribute("name"),
          m.getAttribute("content"),
        ]),
      ),
    );
  }

  test("an insight article carries a full, correct OG + Twitter card", async ({ page, baseURL }) => {
    await page.goto("/ko/insights/ins-1");
    const tags = await ogTags(page);

    expect(tags["og:title"]).toContain("Science Exchange");
    expect(tags["og:description"]).toBeTruthy();
    expect(tags["og:site_name"]).toBe("W Labs");
    expect(tags["og:type"]).toBe("article");
    expect(tags["og:locale"]).toBe("ko_KR");
    expect(tags["og:url"]).toBe(`${new URL(baseURL!).origin}/ko/insights/ins-1`);
    expect(tags["twitter:card"]).toBe("summary_large_image");

    // og:image must be absolute and resolve to a real PNG — a relative URL
    // or a 404 is invisible to every scraper (Facebook/LinkedIn/KakaoTalk).
    const ogImage = tags["og:image"]!;
    expect(ogImage).toMatch(/^https?:\/\//);
    const imgRes = await page.request.get(ogImage);
    expect(imgRes.status()).toBe(200);
    expect(imgRes.headers()["content-type"]).toBe("image/png");
    expect((await imgRes.body()).length).toBeGreaterThan(1000);
  });

  test("/ko/contact and /en carry OG tags too — this bug was site-wide, not Insights-only", async ({
    page,
  }) => {
    await page.goto("/ko/contact");
    let tags = await ogTags(page);
    expect(tags["og:title"]).toBeTruthy();
    expect(tags["og:image"]).toMatch(/^https?:\/\//);
    expect(tags["og:type"]).toBe("website");

    await page.goto("/en");
    tags = await ogTags(page);
    expect(tags["og:locale"]).toBe("en_US");
    expect(tags["og:locale:alternate"]).toBe("ko_KR");
    expect(tags["og:image"]).toMatch(/^https?:\/\//);
  });

  test("a route with no generateMetadata of its own still inherits the group layout's OG defaults", async ({
    page,
  }) => {
    // company/page.tsx exports no generateMetadata — it depends entirely on
    // (site)/layout.tsx's, which is where siteOpenGraphDefaults was added.
    await page.goto("/ko/company");
    const tags = await ogTags(page);
    expect(tags["og:title"]).toBeTruthy();
    expect(tags["og:site_name"]).toBe("W Labs");
    expect(tags["og:image"]).toMatch(/^https?:\/\//);
  });

  test("/og generates a real branded PNG from query params", async ({ page }) => {
    const res = await page.request.get("/og?t=Test%20Title&k=Notes&l=ko");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);

    await page.goto("/og?t=Test%20Title&k=Notes&l=ko");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos343-og-card.png") });
  });
});
