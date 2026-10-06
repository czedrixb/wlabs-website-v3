import { test, expect } from "@playwright/test";

// WOS-320 built the ko/en switch on ?locale=; WOS-314 moved every
// reader-facing page under a /ko or /en path segment instead (no cookie, no
// middleware — see src/lib/locale.ts). WOS-335 replaced the blog's own
// Tailwind "한국어 | English" switcher with the v3 site's shared
// <LangToggle> (the floating "EN"/"KO" pill, src/components/site/chrome/
// LangToggle.tsx — same component site-shell.spec.ts already covers on
// (site) routes).
//
// A later pass removed the /blog listing page — its posts now render as
// cards inside Company > Insights (see e2e/blog-into-insights.spec.ts;
// WOS-342 moved the detail pages to /insights/[slug]) — and switched both
// those cards and the detail page from always-Korean post content to
// pick(locale, ko, en) (src/lib/locale.ts), so unlike the old blog listing,
// post title/excerpt/body now DO switch with the locale toggle, falling
// back to Korean only when a post has no `*En` value.
//
// The old ?locale=kr / ?locale=garbage alias-and-fallback coverage doesn't
// carry over: an unknown *path* segment 404s rather than falling back
// ([locale]/layout.tsx sets dynamicParams = false), since every link this
// app generates only ever points at /ko or /en. resolveLocale's alias
// mapping (kr -> ko) still exists for the wire-compat query API — see
// wire-contract.spec.ts.
test.describe("reader-facing language toggle", () => {
  test("defaults to Korean chrome under /ko", async ({ page }) => {
    await page.goto("/ko/company/insights");

    await expect(page.locator(".lang-float a[lang='ko']")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "false");

    // A post card's own title renders in Korean by default.
    await expect(
      page.locator(".insights-item h3", { hasText: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
  });

  test("switching to English changes chrome and post content", async ({ page }) => {
    await page.goto("/ko/company/insights");

    await page.locator(".lang-float a[lang='en']").click();
    await expect(page).toHaveURL(/\/en\/company\/insights/);

    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".lang-float a[lang='ko']")).toHaveAttribute("aria-pressed", "false");

    // The seeded post's title now reads in English too (titleEn).
    await expect(
      page.locator(".insights-item h3", { hasText: "Publishing Workflow for Editors" }),
    ).toBeVisible();
  });

  test("locale survives clicking through to a post, content switches with it", async ({ page }) => {
    await page.goto("/en/company/insights");

    const postCard = page.locator(".insights-item", {
      hasText: "Publishing Workflow for Editors",
    });
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(/\/en\/insights\/publishing-workflow-for-editors/);

    // Chrome (the lang-float toggle) reflects English on the detail page too.
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");

    // Post heading and body now render in English via titleEn/contentEn.
    await expect(
      page.getByRole("heading", { name: "Publishing Workflow for Editors" }),
    ).toBeVisible();
    await expect(page.locator("article.post-body")).toContainText(
      "Editors log in with email and password",
    );
  });

  test("an unknown locale segment 404s instead of silently falling back", async ({ page }) => {
    const res = await page.goto("/fr/blog");
    expect(res?.status()).toBe(404);
  });
});
