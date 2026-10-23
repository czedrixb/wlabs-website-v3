import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.E2E_PORT || "3100";
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;

// WOS-346: Insights are served from the AISEN Blog API, so e2e runs against
// a local stub (e2e/fixtures/aisen-stub.mjs) instead of the live service —
// specs assert exact fixture content, and the browser must never see the
// real host or key. These three land in BOTH servers' env; process env
// outranks .env, so a developer's real AISEN_* values are overridden for
// the test run. When E2E_BASE_URL points at a manually started server,
// start the stub manually too and give the app server the same values.
const AISEN_STUB_PORT = process.env.AISEN_STUB_PORT || "3101";
const AISEN_ENV = {
  AISEN_API_URL: `http://127.0.0.1:${AISEN_STUB_PORT}`,
  AISEN_KEY_ID: "e2e-key",
  AISEN_SECRET: "e2e-secret",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shares one seeded Postgres DB; keep it deterministic
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // The target editor (WOS-312 §5/§6) is a Korean-locale browser — the
    // admin's language detection is Accept-Language-driven, so simulate
    // that instead of the runner's default en-US.
    locale: "ko-KR",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "setup-editor", testMatch: /editor\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      // editor-role.spec.ts asserts the trimmed-down EDITOR view (WOS-320);
      // running it with the admin storage state would fail it by design.
      // wos337-deploy-smoke.spec.ts is unauthenticated on purpose (see that
      // file) — it belongs to the "smoke" project below, not this one.
      // wos338-company-smtp.spec.ts drives a real Gmail send when GMAIL_* are
      // configured — it belongs to the "mail" project below, run explicitly.
      // wos351-qa-sweep.spec.ts is the full-site deployed-URL QA matrix —
      // it belongs to the "qa" project below, run explicitly.
      testIgnore:
        /editor-role\.spec\.ts|wos337-deploy-smoke\.spec\.ts|wos338-company-smtp\.spec\.ts|wos351-qa-sweep\.spec\.ts/,
    },
    {
      name: "chromium-editor",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/editor.json",
      },
      dependencies: ["setup-editor"],
      testMatch: /editor-role\.spec\.ts/,
    },
    {
      // WOS-337: a deploy smoke check against a real (Vercel) URL — no
      // dependency on the "setup" project's admin login/storageState, since
      // that would drive a real login attempt against whatever is deployed.
      // Only ever run explicitly via --project=smoke.
      name: "smoke",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /wos337-deploy-smoke\.spec\.ts/,
    },
    {
      // WOS-351: full-site visual QA sweep (route × locale × viewport) against
      // a deployed URL. Unauthenticated for the same reason as "smoke" — no
      // login attempt against whatever is deployed. Only ever run explicitly
      // via --project=qa with E2E_BASE_URL set.
      name: "qa",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /wos351-qa-sweep\.spec\.ts/,
    },
    {
      // WOS-338: company Gmail SMTP + the Payload email adapter.
      // Unauthenticated (no storageState / no "setup" dependency) — the
      // forgot-password flow it exercises is a logged-out flow by
      // definition. Only ever run explicitly via --project=mail.
      name: "mail",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /wos338-company-smtp\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "node e2e/fixtures/aisen-stub.mjs",
          url: `http://127.0.0.1:${AISEN_STUB_PORT}/healthz`,
          reuseExistingServer: !process.env.CI,
          timeout: 15_000,
          env: {
            AISEN_STUB_PORT,
            // Fixture image URLs resolve to the app's own /site assets.
            AISEN_STUB_COVER_ORIGIN: baseURL,
            ...AISEN_ENV,
          },
        },
        {
          command: `pnpm build && pnpm start -p ${PORT}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          // NEXT_PUBLIC_SERVER_URL must equal the origin the browser drives:
          // Payload derives its CSRF origin allowlist from it, and a mismatch
          // 403s every admin write (the old "prod-only Save Draft" bug).
          env: { PORT, NEXT_PUBLIC_SERVER_URL: baseURL, ...AISEN_ENV },
        },
      ],
});
