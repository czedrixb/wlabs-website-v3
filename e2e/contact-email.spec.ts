import { test, expect } from "@playwright/test";

// Verifies the mail wiring added to src/app/api/contact/route.ts — ported
// from wsoftlabs-website-v2's own Gmail setup (WOS-286). Only the new `mail`
// field and the skip/best-effort rules are covered here; everything else
// about the route (validation, honeypot shape, ref format) is already
// covered by contact-form.spec.ts / contact-sheet.spec.ts.
//
// Deliberately API-only (no browser submission): a real-address submission
// here would actually email CONTACT_RECIPIENT_EMAIL, and this spec needs to
// stay safe to run in CI/local without mailing anyone.

const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;

test.describe("contact API — mail wiring", () => {
  test("reserved test domain (@example.com) is skipped, never attempted", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      headers: { "x-forwarded-for": `10.98.1.${Date.now() % 250}` },
      data: {
        source: "contact-form",
        name: "Test User",
        email: `wos-mail-${Date.now()}@example.com`,
        topic: "general",
        consentPrivacy: true,
        locale: "en",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ref).toMatch(REF_RE);
    expect(body.mail).toBe("skipped");
  });

  test("honeypot: fake-success response carries no mail field", async ({ page }) => {
    const res = await page.context().request.post("/api/contact", {
      headers: { "x-forwarded-for": `10.98.2.${Date.now() % 250}` },
      data: {
        name: "Bot",
        email: "bot@example.com",
        topic: "general",
        consentPrivacy: true,
        locale: "en",
        website: "http://spam.example",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ref).toMatch(REF_RE);
    expect(body.mail).toBeUndefined();
  });

  test("other reserved domains (.test / .invalid / .net / .org) are also skipped", async ({ page }) => {
    const domains = ["example.net", "example.org", "mail.example.com", "foo.test", "foo.invalid"];
    for (const domain of domains) {
      const res = await page.context().request.post("/api/contact", {
        headers: { "x-forwarded-for": `10.98.3.${Date.now() % 250}` },
        data: {
          source: "sheet-form",
          email: `probe@${domain}`,
          topic: "general",
          consentPrivacy: true,
          locale: "en",
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.mail, `domain ${domain}`).toBe("skipped");
    }
  });
});
