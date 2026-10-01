import { test, expect } from "@playwright/test";

// WOS-334: replaces v3's inquiry-form `localStorage` stub
// (site/index.html:3481-3501, its own `demoNote` disclaimer) with a real
// backend — src/app/api/contact/route.ts. Covers the /contact form and its
// API route only, not the unrelated pages this ticket doesn't touch (per
// the global testing policy's "focus only on the changes").
//
// WOS-337: the `inquiries` Payload collection this used to persist to (and
// read back via /api/inquiries for verification) was removed along with
// every other write-only "Site content" collection — see
// src/app/api/contact/route.ts's header comment. These specs now assert
// only the API response contract (ok/ref, honeypot fake-success, rejection
// codes), not that a document exists anywhere.

const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;

// Queries are scoped to #contact-form (WOS-336): the page-level contact
// sheet carries its own email field / send button / status line, and the
// toast is a second page-level role="status" — unscoped getBy* queries
// became strict-mode violations when those singletons landed.
test.describe("contact form", () => {
  test("ko: renders the translated form, and the localStorage-stub disclaimer is gone", async ({ page }) => {
    await page.goto("/ko/contact");
    const form = page.locator("#contact-form");
    await expect(page.getByRole("heading", { name: "어떤 문제를 풀고 싶으신가요?" })).toBeVisible();
    await expect(form.getByLabel("이름", { exact: true })).toBeVisible();
    await expect(form.getByLabel("이메일", { exact: true })).toBeVisible();
    await expect(form.getByRole("button", { name: "문의 보내기" })).toBeVisible();
    // The prototype's own disclaimer said inquiries only lived in
    // localStorage — its absence is the visible proof this landed.
    await expect(page.getByText("localStorage")).toHaveCount(0);
  });

  test("en: renders the translated form", async ({ page }) => {
    await page.goto("/en/contact");
    const form = page.locator("#contact-form");
    await expect(page.getByRole("heading", { name: "What problem would you like to solve?" })).toBeVisible();
    await expect(form.getByLabel("Name", { exact: true })).toBeVisible();
    await expect(form.getByRole("button", { name: "Send inquiry" })).toBeVisible();
  });

  test("submit is disabled until the privacy checkbox is ticked", async ({ page }) => {
    await page.goto("/ko/contact");
    const submit = page.locator("#contact-form").getByRole("button", { name: "문의 보내기" });
    await expect(submit).toBeDisabled();
    await page.locator("#c-privacy").check();
    await expect(submit).toBeEnabled();
  });

  test("blank required fields: shows the invalid status and never calls the API", async ({ page }) => {
    await page.goto("/ko/contact");
    const form = page.locator("#contact-form");
    const calls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/contact")) calls.push(req.url());
    });

    await page.locator("#c-privacy").check();
    await form.getByRole("button", { name: "문의 보내기" }).click();

    await expect(form.locator(".form-status")).toHaveText("필수 항목을 채우고 개인정보 안내에 동의해 주세요.");
    await page.waitForTimeout(300);
    expect(calls).toHaveLength(0);
  });

  test("valid submission: shows a WL- reference", async ({ page }) => {
    const email = `wos334-${Date.now()}@example.com`;

    await page.goto("/ko/contact");
    const form = page.locator("#contact-form");
    await form.getByLabel("이름", { exact: true }).fill("테스트 사용자");
    await form.getByLabel("이메일", { exact: true }).fill(email);
    await page.locator("#c-topic").selectOption("general");
    await form.getByLabel("내용", { exact: true }).fill("E2E 테스트 문의입니다.");
    await page.locator("#c-privacy").check();
    await form.getByRole("button", { name: "문의 보내기" }).click();

    // WOS-337: no `inquiries` collection to read back any more — the
    // reference code in the success status is the full contract now.
    const status = form.locator(".form-status");
    await expect(status).toContainText(REF_RE, { timeout: 15_000 });
    const statusText = (await status.textContent()) ?? "";
    expect(statusText.match(REF_RE)?.[0]).toBeTruthy();
  });

  test("honeypot: a filled decoy field is silently accepted", async ({ page }) => {
    const ctx = page.context().request;
    const res = await ctx.post("/api/contact", {
      // Unique client IP: the route rate-limits 5/min per IP, and the
      // browser-submitted tests in a full-suite run share the real one.
      headers: { "x-forwarded-for": `10.99.1.${Date.now() % 250}` },
      data: {
        name: "Bot",
        email: "bot@example.com",
        topic: "general",
        consentPrivacy: true,
        locale: "en",
        website: "http://spam.example", // the honeypot
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ref).toMatch(REF_RE);
  });

  test("API: missing consent is rejected", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      headers: { "x-forwarded-for": `10.99.2.${Date.now() % 250}` },
      data: { name: "Test", email: "test@example.com", topic: "general", consentPrivacy: false, locale: "ko" },
    });
    expect(res.status()).toBe(400);
  });

  test("API: unknown topic is rejected", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      headers: { "x-forwarded-for": `10.99.3.${Date.now() % 250}` },
      data: { name: "Test", email: "test@example.com", topic: "not-a-real-topic", consentPrivacy: true, locale: "ko" },
    });
    expect(res.status()).toBe(400);
  });
});
