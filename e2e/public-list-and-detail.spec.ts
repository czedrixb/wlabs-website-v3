import { test, expect } from "@playwright/test";

// Core feature #2: post list + detail view, pagination.
test.describe("public blog list and detail", () => {
  test("list shows published posts, links to detail", async ({ page }) => {
    await page.goto("/ko/blog");
    // WOS-335: the blog's own "W Labs Blog" h1 was replaced by the v3 site
    // chrome + a page-head heading using the blog's own dictionary copy.
    // exact + level:1 — some seeded post titles contain "블로그" as a
    // substring (e.g. "블로그를 다시 만든 이유"), which a loose name match
    // would also pick up.
    await expect(
      page.getByRole("heading", { name: "블로그", exact: true, level: 1 }),
    ).toBeVisible();

    const firstPostLink = page.locator("a", { hasText: "편집자를 위한 발행 워크플로우" });
    await expect(firstPostLink).toBeVisible();
    await firstPostLink.click();

    await expect(page).toHaveURL(/\/ko\/blog\/publishing-workflow-for-editors/);
    await expect(
      page.getByRole("heading", { name: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
    await expect(page.locator("article")).toContainText(
      "이메일과 비밀번호로 로그인하여",
    );
  });

  test("pagination controls reflect page count", async ({ page }) => {
    await page.goto("/ko/blog");
    // Seed data (3 published posts) fits on one page — Next/Previous
    // should be absent, and the page indicator should read the Korean
    // default-locale form ("1페이지" of "1페이지"). The English form
    // ("Page 1 of 1") is covered by locale-toggle.spec.ts.
    await expect(page.getByText("1페이지 중 1페이지")).toBeVisible();
  });
});
