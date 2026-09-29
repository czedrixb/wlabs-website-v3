import { test, expect } from "@playwright/test";

// WOS-336: the site-wide contact sheet — v3's #sheet slide-over
// (site/index.html:3147-3165, behavior :3749-3755) opened by every
// [data-contact] trigger, plus the toast that submissions now raise.
// Covers the sheet, its triggers and the widened API contract only, not
// the unrelated pages this ticket doesn't touch (per the global testing
// policy's "focus only on the changes").

const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;

test.describe("contact sheet", () => {
  test("ko: a footer trigger opens the sheet preselected to its topic; Escape closes it", async ({ page }) => {
    await page.goto("/ko");
    const sheet = page.locator("#sheet");
    await expect(sheet).toBeHidden();

    await page.locator('footer [data-contact="partnership"]').click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "읽던 화면을 떠나지 않고, 바로 물어보세요." })).toBeVisible();
    await expect(sheet.locator("#s-topic")).toHaveValue("partnership");
    // v3 focuses the topic select 50ms after opening.
    await expect(sheet.locator("#s-topic")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("ko: the hero CTA opens the sheet on the general topic; backdrop click closes it", async ({ page }) => {
    await page.goto("/ko");
    await page.locator('.hero-cta [data-contact="general"]').click();
    const sheet = page.locator("#sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.locator("#s-topic")).toHaveValue("general");

    // The sheet root is its own backdrop (v3 closes on e.target === sheet).
    await sheet.click({ position: { x: 8, y: 8 } });
    await expect(sheet).toBeHidden();
  });

  test("en: the sheet renders translated strings", async ({ page }) => {
    await page.goto("/en");
    await page.locator('footer [data-contact="general"]').click();
    const sheet = page.locator("#sheet");
    await expect(sheet.getByRole("heading", { name: "Ask without leaving what you were reading." })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Send inquiry" })).toBeVisible();
  });

  test("valid sheet submission: WL- reference, success toast, and a nameless sheet-form row in admin", async ({ page, baseURL }) => {
    const email = `wos336-sheet-${Date.now()}@example.com`;

    await page.goto("/ko");
    await page.locator('footer [data-contact="newsletter"]').click();
    const sheet = page.locator("#sheet");
    await expect(sheet.locator("#s-topic")).toHaveValue("newsletter");

    await sheet.locator("#s-email").fill(email);
    await sheet.locator("#s-msg").fill("E2E 시트 문의입니다.");
    await sheet.locator("#s-privacy").check();
    await sheet.getByRole("button", { name: "문의 보내기" }).click();

    const status = sheet.getByRole("status");
    await expect(status).toContainText(REF_RE, { timeout: 15_000 });
    const ref = ((await status.textContent()) ?? "").match(REF_RE)?.[0];
    expect(ref).toBeTruthy();

    // The toast (v3's index.html:3759 widget) fires alongside the status line.
    await expect(page.locator(".toast.on")).toContainText("문의가 접수되었습니다");

    // Readable in admin (cookie-authed REST read, same convention as
    // contact-form.spec.ts) — recorded as sheet-form, with no name.
    const ctx = page.context().request;
    const origin = { Origin: baseURL! };
    const res = await ctx.get(`/api/inquiries?where[ref][equals]=${ref}&limit=1`, { headers: origin });
    expect(res.status()).toBe(200);
    const { docs } = await res.json();
    expect(docs).toHaveLength(1);
    expect(docs[0].email).toBe(email);
    expect(docs[0].topic).toBe("newsletter");
    expect(docs[0].source).toBe("sheet-form");
    expect(docs[0].name ?? null).toBeNull();

    await ctx.delete(`/api/inquiries/${docs[0].id}`, { headers: origin });
  });

  test("API: sheet-form needs no name, but contact-form still does", async ({ page, baseURL }) => {
    const ctx = page.context().request;
    const base = { email: "wos336-api@example.com", topic: "general", consentPrivacy: true, locale: "ko" as const };
    // Unique client IP: the route rate-limits 5/min per IP, and the
    // browser-submitted tests in a full-suite run share the real one.
    const headers = { "x-forwarded-for": `10.99.4.${Date.now() % 250}` };

    const sheetRes = await ctx.post("/api/contact", { headers, data: { ...base, source: "sheet-form" } });
    expect(sheetRes.status()).toBe(200);
    const sheetBody = await sheetRes.json();
    expect(sheetBody.ok).toBe(true);

    const formRes = await ctx.post("/api/contact", { headers, data: { ...base, source: "contact-form" } });
    expect(formRes.status()).toBe(400);

    const unknownRes = await ctx.post("/api/contact", { headers, data: { ...base, source: "not-a-form" } });
    expect(unknownRes.status()).toBe(400);

    // Clean up the row the sheet-form call created.
    const origin = { Origin: baseURL! };
    const found = await (
      await ctx.get(`/api/inquiries?where[email][equals]=wos336-api@example.com&limit=10`, { headers: origin })
    ).json();
    for (const doc of found.docs) {
      await ctx.delete(`/api/inquiries/${doc.id}`, { headers: origin });
    }
  });
});
