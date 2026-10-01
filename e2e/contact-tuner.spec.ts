import { test, expect } from "@playwright/test";

// WOS-336: the contact page's sp-tuner resonance finder (v3
// site/index.html:2702-2963 + MOD:tuner :4841-5325), the `.on-navy`
// inquiry surface, the tuner→form hand-off, and the 8-question inquiry
// FAQ. Covers the contact screen only (per the global testing policy's
// "focus only on the changes").

test.describe("contact tuner", () => {
  test("ko: the inquiry screen renders on navy with the tuner idle", async ({ page }) => {
    await page.goto("/ko/contact");
    await expect(page.locator("section#contact.on-navy")).toBeVisible();
    await expect(page.getByRole("heading", { name: "당신의 문제에 파동을 맞춰 보세요." })).toBeVisible();
    // Nothing set: the waiting line shows, Reset is disabled, the scope is neutral.
    await expect(page.locator("#sp-tuner-ro-wait")).toBeVisible();
    await expect(page.locator("#sp-tuner-reset")).toBeDisabled();
    await expect(page.locator("#sp-tuner-scope")).toHaveClass(/is-neutral/);
  });

  test("ko: setting the building dial resolves a service, reorders the grid and pre-fills the form", async ({ page }) => {
    await page.goto("/ko/contact");
    await page.locator('.sp-tuner-rail[data-sp-axis="building"] button[data-sp-set="0"]').click(); // AI 기능

    // Readout: 01 / Intelligence resonates, WIZ is the product match.
    await expect(page.locator("#sp-tuner-ro-service-v")).toContainText("01 / Intelligence");
    await expect(page.locator("#sp-tuner-ro-service-v")).toContainText("AI·지능형 자동화");
    await expect(page.locator("#sp-tuner-ro-product-v")).toContainText("WIZ Assistant");
    // FLIP: the matched service card moves to the front of its grid.
    await expect(page.locator("#sp-tuner-svc-grid > article").first()).toHaveAttribute("data-sp-id", "1");
    await expect(page.locator('#sp-tuner-svc-grid article[data-sp-id="1"]')).toHaveClass(/is-match/);
    // Hand-off: topic follows the service, the summary lands in the message box.
    await expect(page.locator("#c-topic")).toHaveValue("ai");
    await expect(page.locator("#c-msg")).toHaveValue(/AI 기능/);
    await expect(page.locator("#sp-tuner-reset")).toBeEnabled();
  });

  test("ko: all three dials lock the scope and suggest a first step", async ({ page }) => {
    await page.goto("/ko/contact");
    await page.locator('.sp-tuner-rail[data-sp-axis="building"] button[data-sp-set="0"]').click(); // AI 기능
    await page.locator('.sp-tuner-rail[data-sp-axis="stage"] button[data-sp-set="3"]').click(); // 운영 중
    await page.locator('.sp-tuner-rail[data-sp-axis="pace"] button[data-sp-set="2"]').click(); // 급함

    await expect(page.locator("#sp-tuner-scope")).toHaveClass(/is-locked/, { timeout: 5_000 });
    // production × urgent → the staged migration plan.
    await expect(page.locator("#sp-tuner-ro-step-v")).toHaveText("단계적 전환 계획");
    // The locked summary carries all three settings + the resonance.
    const msg = page.locator("#c-msg");
    await expect(msg).toHaveValue(/AI 기능 · 운영 중 · 급함/);
    await expect(msg).toHaveValue(/공명: AI·지능형 자동화/);
  });

  test("ko: a visitor's own message is never overwritten by the tuner", async ({ page }) => {
    await page.goto("/ko/contact");
    await page.locator("#c-msg").fill("직접 작성한 문의 내용입니다.");
    await page.locator('.sp-tuner-rail[data-sp-axis="building"] button[data-sp-set="1"]').click(); // 맞춤 소프트웨어

    await expect(page.locator("#c-topic")).toHaveValue("custom");
    await expect(page.locator("#c-msg")).toHaveValue("직접 작성한 문의 내용입니다.");
  });

  test("ko: Reset returns the dials, readout and message to idle", async ({ page }) => {
    await page.goto("/ko/contact");
    await page.locator('.sp-tuner-rail[data-sp-axis="building"] button[data-sp-set="0"]').click();
    await expect(page.locator("#c-msg")).toHaveValue(/AI 기능/);

    await page.locator("#sp-tuner-reset").click();
    await expect(page.locator("#sp-tuner-ro-wait")).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("#sp-tuner-reset")).toBeDisabled();
    await expect(page.locator("#c-msg")).toHaveValue("");
    await expect(page.locator("#sp-tuner-scope")).toHaveClass(/is-neutral/);
  });

  test("ko: the inquiry FAQ carries all eight questions without CTAs", async ({ page }) => {
    await page.goto("/ko/contact");
    const faq = page.locator('[aria-labelledby="sp-faq2-t-inq"]');
    await expect(faq.locator(".sp-faq2-item")).toHaveCount(8);
    await expect(faq.getByRole("button", { name: "한국어와 영어로 모두 일하나요?" })).toBeVisible();
    await expect(faq.locator(".sp-faq2-ctas")).toHaveCount(0);
    // Q3 keeps its regulatory cap note.
    await faq.getByRole("button", { name: "SkinArch와 BrainArch는 의료기기인가요?" }).click();
    await expect(faq.locator(".sp-faq2-item.is-open .cap")).toContainText("공개된 성능 수치는 없습니다");
  });

  test("en: the tuner translates", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page.getByRole("heading", { name: "Tune the wave to your problem." })).toBeVisible();
    await page.locator('.sp-tuner-rail[data-sp-axis="building"] button[data-sp-set="2"]').click(); // imaging / data analysis
    await expect(page.locator("#sp-tuner-ro-service-v")).toContainText("03 / Insight");
    await expect(page.locator("#sp-tuner-ro-product-v")).toContainText("SkinArch (Research Use Only)");
    await expect(page.locator("#c-topic")).toHaveValue("data");
  });
});
