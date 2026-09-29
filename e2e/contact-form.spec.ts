import { test, expect } from "@playwright/test";

// WOS-334: replaces v3's inquiry-form `localStorage` stub
// (site/index.html:3481-3501, its own `demoNote` disclaimer) with a real
// backend — src/app/api/contact/route.ts + the `inquiries` Payload
// collection. Covers the /contact form and its API route only, not the
// unrelated pages this ticket doesn't touch (per the global testing
// policy's "focus only on the changes").

const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;

test.describe("contact form", () => {
  test("ko: renders the translated form, and the localStorage-stub disclaimer is gone", async ({ page }) => {
    await page.goto("/ko/contact");
    await expect(page.getByRole("heading", { name: "어떤 문제를 풀고 싶으신가요?" })).toBeVisible();
    await expect(page.getByLabel("이름", { exact: true })).toBeVisible();
    await expect(page.getByLabel("이메일", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "문의 보내기" })).toBeVisible();
    // The prototype's own disclaimer said inquiries only lived in
    // localStorage — its absence is the visible proof this landed.
    await expect(page.getByText("localStorage")).toHaveCount(0);
  });

  test("en: renders the translated form", async ({ page }) => {
    await page.goto("/en/contact");
    await expect(page.getByRole("heading", { name: "What problem would you like to solve?" })).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send inquiry" })).toBeVisible();
  });

  test("submit is disabled until the privacy checkbox is ticked", async ({ page }) => {
    await page.goto("/ko/contact");
    const submit = page.getByRole("button", { name: "문의 보내기" });
    await expect(submit).toBeDisabled();
    await page.locator("#c-privacy").check();
    await expect(submit).toBeEnabled();
  });

  test("blank required fields: shows the invalid status and never calls the API", async ({ page }) => {
    await page.goto("/ko/contact");
    const calls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/contact")) calls.push(req.url());
    });

    await page.locator("#c-privacy").check();
    await page.getByRole("button", { name: "문의 보내기" }).click();

    await expect(page.getByRole("status")).toHaveText("필수 항목을 채우고 개인정보 안내에 동의해 주세요.");
    await page.waitForTimeout(300);
    expect(calls).toHaveLength(0);
  });

  test("valid submission: shows a WL- reference and the inquiry is readable in Payload admin", async ({ page, baseURL }) => {
    const email = `wos334-${Date.now()}@example.com`;

    await page.goto("/ko/contact");
    await page.getByLabel("이름", { exact: true }).fill("테스트 사용자");
    await page.getByLabel("이메일", { exact: true }).fill(email);
    await page.locator("#c-topic").selectOption("general");
    await page.getByLabel("내용", { exact: true }).fill("E2E 테스트 문의입니다.");
    await page.locator("#c-privacy").check();
    await page.getByRole("button", { name: "문의 보내기" }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText(REF_RE, { timeout: 15_000 });
    const statusText = (await status.textContent()) ?? "";
    const ref = statusText.match(REF_RE)?.[0];
    expect(ref).toBeTruthy();

    // Readable in admin: the same REST read the admin list view itself
    // uses (cookie-authed — this project runs with the admin storageState).
    // Origin satisfies Payload's CSRF check, which this app enforces on
    // cookie-authed reads too, not just writes (see payload.config.ts's
    // csrfOrigins comment) — same convention as editor-role.spec.ts's own
    // REST cleanup.
    const ctx = page.context().request;
    const origin = { Origin: baseURL! };
    const res = await ctx.get(`/api/inquiries?where[ref][equals]=${ref}&limit=1`, { headers: origin });
    expect(res.status()).toBe(200);
    const { docs } = await res.json();
    expect(docs).toHaveLength(1);
    expect(docs[0].email).toBe(email);
    expect(docs[0].topic).toBe("general");
    expect(docs[0].captchaStatus).toBe("skipped"); // no RECAPTCHA_SECRET configured

    // Clean up — deterministic re-runs against the shared seeded DB, same
    // convention as editor-role.spec.ts's own /create-draft sweep.
    await ctx.delete(`/api/inquiries/${docs[0].id}`, { headers: origin });
  });

  test("honeypot: a filled decoy field is silently accepted and creates no row", async ({ page, baseURL }) => {
    const ctx = page.context().request;
    const origin = { Origin: baseURL! };
    const res = await ctx.post("/api/contact", {
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

    const found = await (
      await ctx.get(`/api/inquiries?where[email][equals]=bot@example.com&limit=10`, { headers: origin })
    ).json();
    expect(found.docs).toHaveLength(0);
  });

  test("API: missing consent is rejected", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      data: { name: "Test", email: "test@example.com", topic: "general", consentPrivacy: false, locale: "ko" },
    });
    expect(res.status()).toBe(400);
  });

  test("API: unknown topic is rejected", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      data: { name: "Test", email: "test@example.com", topic: "not-a-real-topic", consentPrivacy: true, locale: "ko" },
    });
    expect(res.status()).toBe(400);
  });
});
