import { test, expect } from "@playwright/test";
import path from "path";

// WOS-338: verifies the W Labs company Gmail credentials AND that Payload's
// own email adapter is wired to the same transport (src/payload.config.ts).
//
// Run against a MANUALLY started server (playwright.config.ts's webServer
// block is skipped whenever E2E_BASE_URL is set — the corepack/pnpm mismatch
// that makes `pnpm build && pnpm start` unreliable here):
//
//   corepack pnpm dev                                  # terminal 1, with .env loaded
//   E2E_BASE_URL=http://localhost:3000 \               # terminal 2
//     corepack pnpm exec playwright test e2e/wos338-company-smtp.spec.ts --project=mail
//   corepack pnpm exec playwright show-report
//
// The "unconfigured" tests are the load-bearing ones: they prove the
// conditional `email` key in payload.config.ts never crashes a boot with
// GMAIL_* unset (local dev/CI default). The "configured" tests perform a
// REAL Gmail send and self-skip unless all three vars are present.

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";
const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@wsoftlabs.dev";
const MAIL_CONFIGURED = Boolean(
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.CONTACT_RECIPIENT_EMAIL,
);
const ORIGIN = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("WOS-338 company SMTP + Payload email adapter", () => {
  // --- boots cleanly either way -------------------------------------------
  test("admin login renders — the email config resolved without throwing", async ({ page }) => {
    // If nodemailerAdapter() had been called unguarded (ethereal) or with
    // verify enabled against unreachable SMTP, config resolution would hang
    // or throw and this page would 500 instead of rendering.
    await page.goto("/admin/login");
    await expect(page.locator("#field-email")).toBeVisible();
    await expect(page.locator("#field-password")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos338-admin-login.png") });
  });

  test("forgot-password screen renders", async ({ page }) => {
    await page.goto("/admin/forgot");
    await expect(page.locator("#field-email")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos338-forgot-form.png") });
  });

  test("contact API is unchanged: reserved domains still skip", async ({ page }) => {
    // Regression guard — payload.config.ts now imports lib/site/mailer.ts,
    // so a mistake there would surface as a changed contact-route contract.
    const res = await page.context().request.post("/api/contact", {
      headers: { Origin: ORIGIN, "x-forwarded-for": `10.98.8.${Date.now() % 250}` },
      data: {
        source: "contact-form",
        name: "WOS-338",
        email: `wos338-${Date.now()}@example.com`,
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

  // --- real sends, gated ---------------------------------------------------
  test.describe("with the company Gmail credentials configured", () => {
    test.skip(!MAIL_CONFIGURED, "set GMAIL_USER / GMAIL_APP_PASSWORD / CONTACT_RECIPIENT_EMAIL");

    test("Payload's forgot-password actually delivers through the adapter", async ({ page }) => {
      // forgotPassword.js awaits email.sendEmail() with no try/catch, so bad
      // credentials surface as a Gmail EAUTH throw -> HTTP 500. A 200 means
      // Gmail accepted the message. Must be the SEEDED admin's address: an
      // unknown email returns null silently (anti-enumeration) and sends
      // nothing, which would make this assertion vacuous.
      const res = await page.context().request.post("/api/users/forgot-password", {
        headers: { Origin: ORIGIN },
        data: { email: ADMIN_EMAIL },
      });
      expect(res.status()).toBe(200);

      await page.goto("/admin/forgot");
      await page.locator("#field-email").fill(ADMIN_EMAIL);
      await page.locator("form").getByRole("button").click();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos338-forgot-submitted.png") });
    });

    test("contact form sends from the company account", async ({ page }) => {
      const res = await page.context().request.post("/api/contact", {
        headers: { Origin: ORIGIN, "x-forwarded-for": `10.98.9.${Date.now() % 250}` },
        data: {
          source: "contact-form",
          name: "WOS-338 SMTP Verification",
          email: process.env.CONTACT_RECIPIENT_EMAIL!,
          topic: "general",
          message: "WOS-338 company SMTP verification — ignore, no reply needed.",
          consentPrivacy: true,
          locale: "ko",
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      // sendMailChecked() only returns "sent" when Gmail's own `accepted`
      // list contains the intended recipient, so this is a credential check,
      // not just a no-throw check.
      expect(body.mail).toBe("sent");
      await page.goto("/ko/contact");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos338-contact.png") });
    });
  });
});
