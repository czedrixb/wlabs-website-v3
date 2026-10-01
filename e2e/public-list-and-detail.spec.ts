import { test, expect } from "@playwright/test";

// Core feature #2: post list + detail view. The /blog listing page is
// gone — published posts now render as data-kind="blog" cards inside the
// Company > Insights panel (NewsList.tsx), alongside that panel's own
// hardcoded items. No pagination there (unlike the old listing, which
// paginated at POSTS_PAGE_SIZE); getPostsPage(1) is a flat latest-10 fetch.
test.describe("public blog list and detail", () => {
  test("insights panel lists published posts, links to detail", async ({ page }) => {
    await page.goto("/ko/company/insights");

    // The post card's own title lives in its <h3>, not the link text (the
    // link reads "글 읽기 →") — scope to the .news-item card itself, same
    // pattern site-company.spec.ts uses for the product-note item.
    const postCard = page.locator('.news-item[data-kind="blog"]', {
      hasText: "편집자를 위한 발행 워크플로우",
    });
    await expect(postCard).toBeVisible();
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(/\/ko\/blog\/publishing-workflow-for-editors/);
    await expect(
      page.getByRole("heading", { name: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
    await expect(page.locator("article")).toContainText(
      "이메일과 비밀번호로 로그인하여",
    );
  });
});
