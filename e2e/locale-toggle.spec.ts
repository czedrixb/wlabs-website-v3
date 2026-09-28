import { test, expect } from "@playwright/test";

// WOS-320 built the ko/en switch on ?locale=; WOS-314 moved every
// reader-facing page under a /ko or /en path segment instead (no cookie, no
// middleware — see src/lib/locale.ts). This toggle switches interface chrome
// only (nav labels, pagination, empty state, byline fallback) — post
// title/excerpt/body always render the Korean base fields, never the `*En`
// admin fields. See src/lib/locale.ts `pick` for the API's (separate,
// content-switching) use of the same *En fields.
//
// The old ?locale=kr / ?locale=garbage alias-and-fallback coverage doesn't
// carry over: an unknown *path* segment 404s rather than falling back
// ([locale]/layout.tsx sets dynamicParams = false), since every link this
// app generates only ever points at /ko or /en. resolveLocale's alias
// mapping (kr -> ko) still exists for the wire-compat query API — see
// wire-contract.spec.ts.
test.describe("reader-facing language toggle", () => {
  test("defaults to Korean chrome under /ko", async ({ page }) => {
    await page.goto("/ko/blog");

    await expect(page.getByText("1페이지 중 1페이지")).toBeVisible();
    await expect(page.getByRole("link", { name: "이전" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "다음" })).toHaveCount(0);

    const koLink = page.getByRole("link", { name: "한국어" });
    await expect(koLink).toHaveAttribute("aria-current", "true");
  });

  test("switching to English changes chrome but not post content", async ({ page }) => {
    await page.goto("/ko/blog");

    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/blog/);

    // Chrome switched.
    await expect(page.getByText("Page 1 of 1")).toBeVisible();
    await expect(page.getByRole("link", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Content did not: the seeded post title stays Korean under /en.
    await expect(
      page.getByRole("heading", { name: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
  });

  test("locale survives clicking through to a post, content stays Korean", async ({ page }) => {
    await page.goto("/en/blog");

    await page
      .locator("a", { hasText: "편집자를 위한 발행 워크플로우" })
      .click();

    await expect(page).toHaveURL(/\/en\/blog\/publishing-workflow-for-editors/);

    // Chrome (the header toggle) reflects English on the detail page too.
    await expect(page.getByRole("link", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    // Post heading and body remain Korean.
    await expect(
      page.getByRole("heading", { name: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
    await expect(page.locator("article")).toContainText("이메일과 비밀번호로 로그인하여");
  });

  test("an unknown locale segment 404s instead of silently falling back", async ({ page }) => {
    const res = await page.goto("/fr/blog");
    expect(res?.status()).toBe(404);
  });
});
