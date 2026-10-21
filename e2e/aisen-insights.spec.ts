import { test, expect } from "@playwright/test";

// WOS-346: Insights served from the AISEN Blog API. The app talks to the
// local stub (e2e/fixtures/aisen-stub.mjs, started by playwright.config.ts)
// whose fixtures mirror the live dev project `w-soft-lab-website`: five ko
// posts ins-1…ins-5 (covers on ins-1/ins-4, ins-4 with two inline body
// figures), and ONE English version — ins-5 — cross-linked through
// `translations`. This spec owns the AISEN-specific behavior: per-locale
// listings, SEO metadata from the `seo` block, translations-driven hreflang
// and language switching, real 404s for missing language versions, the
// server-only guarantee (the browser never talks to the AISEN host), feeds,
// and the AISEN-down degradation. The shared article shell is covered in
// wos342-insights.spec.ts.

const SEEDED_TITLE_KO = "편집자를 위한 발행 워크플로우";
const STUB_ORIGIN = `http://127.0.0.1:${process.env.AISEN_STUB_PORT || "3101"}`;

// A second `next start` of the same build, with AISEN_API_URL pointed at a
// dead port — set by the runner; the degradation tests are skipped without
// it. Pattern and caveats as e2e/db-resilience.spec.ts (the two servers
// share .next and so the data cache; the invariant asserted below holds
// warm or cold).
const AISEN_DOWN_URL = process.env.E2E_AISEN_DOWN_URL;
const AISEN_DOWN_ORIGIN = AISEN_DOWN_URL ? new URL(AISEN_DOWN_URL).origin : undefined;

test.describe("per-locale listings", () => {
  test("/ko/company/insights lists the five AISEN posts merged with CMS posts, newest first", async ({
    page,
  }) => {
    await page.goto("/ko/company/insights");

    // Page 1 = 6 newest of (5 AISEN + seeded CMS posts).
    await expect(page.locator(".insights-item")).toHaveCount(6);
    await expect(page.locator(".insights-item", { hasText: SEEDED_TITLE_KO })).toBeVisible();
    // ins-4 (2026-08, the newest AISEN fixture) is on page 1 with its cover.
    const ins4 = page.locator(".insights-item#ins-4");
    await expect(ins4).toBeVisible();
    await expect(ins4.locator(".ins-shot")).toBeAttached();

    // The card order is the dateKey sort, newest first.
    const times = await page
      .locator(".insights-item time")
      .evaluateAll((els) => els.map((el) => el.getAttribute("datetime") ?? ""));
    const sorted = [...times].sort((a, b) => b.localeCompare(a));
    expect(times).toEqual(sorted);
  });

  test("/en/company/insights lists only the English AISEN post plus CMS posts", async ({
    page,
  }) => {
    await page.goto("/en/company/insights");

    // ins-5 is the one fixture with a published English version…
    await expect(page.locator(".insights-item#ins-5")).toContainText(
      "When the Budget Isn't Visible",
    );
    // …and the ko-only posts must not leak into /en.
    for (const slug of ["ins-1", "ins-2", "ins-3", "ins-4"]) {
      await expect(page.locator(`.insights-item#${slug}`)).toHaveCount(0);
    }
  });
});

test.describe("SEO from the AISEN `seo` block", () => {
  test("/ko/insights/ins-4 takes title + description from seo, no keywords tag", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-4");

    await expect(page).toHaveTitle(/SkinArch와 BrainArch/);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      "content",
      /LC-OCT 피부 구조 분석과 뇌 CT 영상 분석/,
    );
    // The ko fixture's seo.keywords is [] — the tag must not be emitted.
    await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
  });

  test("/en/insights/ins-5 emits the writer's keywords", async ({ page }) => {
    await page.goto("/en/insights/ins-5");
    await expect(page.locator('meta[name="keywords"]')).toHaveAttribute(
      "content",
      /project management system/,
    );
  });

  test("hreflang reflects published translations only", async ({ page }) => {
    // ins-4 exists in Korean alone: its head must advertise ko and NOT en
    // (the prefix-swapped /en URL is a real 404).
    await page.goto("/ko/insights/ins-4");
    await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute(
      "href",
      /\/ko\/insights\/ins-4$/,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);

    // ins-5 is published in both languages — both alternates, cross-linked.
    await page.goto("/ko/insights/ins-5");
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      /\/en\/insights\/ins-5$/,
    );
  });
});

test.describe("language switching", () => {
  test("ins-5 shows the footer switch and it leads to the English version", async ({ page }) => {
    await page.goto("/ko/insights/ins-5");

    const sw = page.locator(".ins-foot .ins-lang");
    await expect(sw).toHaveText("View in English");
    await expect(sw).toHaveAttribute("href", "/en/insights/ins-5");
    await sw.click();
    await expect(page).toHaveURL(/\/en\/insights\/ins-5$/);
    await expect(page.locator(".ins-hero h1")).toContainText("When the Budget Isn't Visible");
    // And back.
    await expect(page.locator(".ins-foot .ins-lang")).toHaveText("한국어로 보기");
  });

  test("the global EN/KO toggle targets the translation on ins-5", async ({ page }) => {
    await page.goto("/ko/insights/ins-5");
    // The override lands post-hydration via LangTargetContext.
    await expect(page.locator('.lang-float a[lang="en"]')).toHaveAttribute(
      "href",
      "/en/insights/ins-5",
    );
  });

  test("on untranslated ins-1 the footer switch is absent and the toggle falls back to the list", async ({
    page,
  }) => {
    await page.goto("/ko/insights/ins-1");
    await expect(page.locator(".ins-foot .ins-lang")).toHaveCount(0);
    await expect(page.locator('.lang-float a[lang="en"]')).toHaveAttribute(
      "href",
      "/en/company/insights",
    );
  });

  test("CMS posts keep the plain prefix swap", async ({ page }) => {
    await page.goto("/ko/insights/publishing-workflow-for-editors");
    await expect(page.locator('.lang-float a[lang="en"]')).toHaveAttribute(
      "href",
      "/en/insights/publishing-workflow-for-editors",
    );
  });
});

test.describe("missing language versions are real 404s", () => {
  test("/en/insights/ins-1 (no English version) returns HTTP 404", async ({ request }) => {
    const res = await request.get("/en/insights/ins-1");
    expect(res.status()).toBe(404);
  });

  test("/ko/insights/does-not-exist returns HTTP 404", async ({ request }) => {
    const res = await request.get("/ko/insights/does-not-exist");
    expect(res.status()).toBe(404);
  });
});

test.describe("server-only: the browser never talks to the AISEN API", () => {
  test("a list → detail journey makes zero requests to the AISEN origin", async ({ page }) => {
    const offsite: string[] = [];
    page.on("request", (req) => {
      if (req.url().startsWith(STUB_ORIGIN)) offsite.push(req.url());
    });

    await page.goto("/ko/company/insights");
    await page.locator(".insights-item#ins-4 a").click();
    await expect(page.locator(".ins-hero h1")).toContainText("SkinArch");
    await expect(page.locator(".ins-prose article.post-body img").first()).toBeVisible();

    expect(offsite).toEqual([]);
  });
});

test.describe("feeds and sitemap carry the AISEN posts", () => {
  test("/ko/rss.xml includes the AISEN posts; /en/rss.xml only the English one", async ({
    request,
  }) => {
    const ko = await (await request.get("/ko/rss.xml")).text();
    expect(ko).toContain("/ko/insights/ins-4");
    expect(ko).toContain("SkinArch와 BrainArch");

    const en = await (await request.get("/en/rss.xml")).text();
    expect(en).toContain("/en/insights/ins-5");
    expect(en).not.toContain("/en/insights/ins-1");
  });

  test("sitemap.xml: ins-5 carries both hreflangs, ins-1 carries ko only", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/ko/insights/ins-1");
    expect(xml).toContain("/en/insights/ins-5");
    expect(xml).not.toContain("/en/insights/ins-1");
  });
});

test.describe("when AISEN is down", () => {
  test.skip(!AISEN_DOWN_URL, "E2E_AISEN_DOWN_URL not set");

  test("the insights panel still renders CMS posts with no error surfaced", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`${AISEN_DOWN_ORIGIN}/ko/company/insights`, { timeout: 90_000 });
    await expect(
      page.locator("main .insights-item", { hasText: SEEDED_TITLE_KO }),
    ).toBeVisible({ timeout: 30_000 });
    // No error boundary, no raw 500.
    await expect(page.getByText("일시적인 오류가 발생했습니다")).toHaveCount(0);
    await expect(page.getByText("A server error occurred")).toHaveCount(0);
  });

  test("a CMS post detail still renders when AISEN is down", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`${AISEN_DOWN_ORIGIN}/ko/insights/publishing-workflow-for-editors`, {
      timeout: 90_000,
    });
    await expect(page.locator(".ins-hero h1")).toHaveText(SEEDED_TITLE_KO, { timeout: 30_000 });
  });
});
