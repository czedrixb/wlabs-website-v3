import { test, expect } from "@playwright/test";
import path from "path";

// WOS-337: a redeploy-verification smoke check against the real deployed
// URL (Vercel), not the local webServer-managed instance every other spec
// in this directory runs against. Deliberately unauthenticated (its own
// "smoke" Playwright project, see playwright.config.ts) — a deploy smoke
// check shouldn't depend on auth.setup.ts succeeding first, and it has no
// opinion on which admin credentials the deployed env was seeded with.
//
// Run with: E2E_BASE_URL=https://<deployed-url> pnpm exec playwright test \
//   e2e/wos337-deploy-smoke.spec.ts --project=smoke
//
// Skips entirely without E2E_BASE_URL so it never runs as part of the
// regular local/CI suite (which has no live Supabase/Gmail config to hit).
test.skip(!process.env.E2E_BASE_URL, "WOS-337 deploy smoke check only runs against a live E2E_BASE_URL");

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots";
const REF_RE = /WL-\d{6}-[A-Z0-9]{4}/;

test.describe("WOS-337 deploy smoke", () => {
  test("/ redirects to /ko and the home hero renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ko$/);
    await expect(page.getByRole("heading", { name: "복잡한 문제를" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos337-home.png"), fullPage: false });
  });

  test("/ko/company/insights lists posts from the DB", async ({ page }) => {
    await page.goto("/ko/company/insights");
    await expect(page.locator(".news-item").first()).toBeVisible();
    const postItems = page.locator('.news-item[data-kind="blog"]');
    expect(await postItems.count()).toBeGreaterThan(0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos337-insights.png"), fullPage: false });
  });

  test("a post detail page renders its content", async ({ page }) => {
    await page.goto("/ko/company/insights");
    const firstPost = page.locator('.news-item[data-kind="blog"]').first();
    await firstPost.getByRole("link").click();
    await expect(page.locator("article.post-body")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos337-post-detail.png"), fullPage: false });
  });

  test("/ko/contact renders and a live submission sends mail", async ({ page }) => {
    await page.goto("/ko/contact");
    await expect(page.getByRole("heading", { name: "어떤 문제를 풀고 싶으신가요?" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos337-contact.png"), fullPage: false });

    // Deliberately a real, non-reserved address — contact-email.spec.ts
    // covers the @example.com "skipped" path already; this is the one place
    // that exercises the "sent" branch of sendInquiryMail end to end against
    // the live Gmail env vars (GMAIL_USER/GMAIL_APP_PASSWORD/
    // CONTACT_RECIPIENT_EMAIL), which the local/CI suite never configures.
    const res = await page.context().request.post("/api/contact", {
      headers: { Origin: process.env.E2E_BASE_URL! },
      data: {
        source: "contact-form",
        name: "WOS-337 Deploy Smoke Test",
        email: process.env.CONTACT_RECIPIENT_EMAIL || "czedrix@wsoft.space",
        topic: "general",
        message: "WOS-337 redeploy verification — ignore, no reply needed.",
        consentPrivacy: true,
        locale: "ko",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.ref).toMatch(REF_RE);
    expect(body.mail).toBe("sent");
  });

  test("/admin serves the login screen", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("#field-email")).toBeVisible();
    await expect(page.locator("#field-password")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "wos337-admin-login.png"), fullPage: false });
  });
});
