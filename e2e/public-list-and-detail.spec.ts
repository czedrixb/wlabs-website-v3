import { test, expect } from "@playwright/test";

// Core feature #2: post list + detail view. The /blog listing page is
// gone — published posts render as cards inside the Company > Insights
// panel (InsightsList.tsx), interleaved with the six static v3 articles,
// six to a page (WOS-342). Fresh seeded posts sort newest, so the one
// asserted here is always on page 1.
test.describe("public blog list and detail", () => {
  test("insights panel lists published posts, links to detail", async ({ page }) => {
    await page.goto("/ko/company/insights");

    // The post card's own title lives in its <h3>, not the link text (the
    // link reads "글 읽기 →") — scope to the .insights-item card itself.
    const postCard = page.locator(".insights-item", {
      hasText: "편집자를 위한 발행 워크플로우",
    });
    await expect(postCard).toBeVisible();
    await postCard.getByRole("link").click();

    await expect(page).toHaveURL(/\/ko\/insights\/publishing-workflow-for-editors/);
    await expect(
      page.getByRole("heading", { name: "편집자를 위한 발행 워크플로우" }),
    ).toBeVisible();
    await expect(page.locator("article.post-body")).toContainText(
      "이메일과 비밀번호로 로그인하여",
    );
  });
});
