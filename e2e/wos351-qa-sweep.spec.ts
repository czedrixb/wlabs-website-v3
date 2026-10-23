import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

// WOS-351: full-site visual QA sweep against the deployed URL — every public
// route × {ko,en} × {pc,tablet,mobile}, full-page screenshots plus cheap
// automated checks (overflow, broken images, console errors, failed
// responses). Unauthenticated ("qa" project, see playwright.config.ts); like
// wos337 it only ever runs explicitly, against a live E2E_BASE_URL:
//
//   E2E_BASE_URL=https://<deployed-url> E2E_SCREENSHOT_DIR=<dir> \
//     pnpm exec playwright test e2e/wos351-qa-sweep.spec.ts --project=qa
//
// Findings triage happens outside the suite (docs/qa/WOS-351-findings.md);
// assertions here are soft so one bad page never hides the rest of the matrix.
test.skip(!process.env.E2E_BASE_URL, "WOS-351 QA sweep only runs against a live E2E_BASE_URL");

const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR || "e2e/screenshots/wos351";
const REPORT_PATH = path.join(SCREENSHOT_DIR, "sweep-report.json");

const DEVICES = [
  ["pc", { width: 1440, height: 900 }],
  ["tablet", { width: 834, height: 1194 }],
  ["mobile", { width: 390, height: 844 }],
] as const;

const LOCALES = ["ko", "en"] as const;

type Route = {
  id: string;
  path: (locale: string) => string;
  // main navigation response status expected for this route
  expectStatus?: number;
  // discovered at runtime instead of a fixed path (first live insights post)
  discover?: "insights-detail";
  // capture an extra viewport shot after scrolling (header-state evidence)
  scrolledShot?: boolean;
};

const ROUTES: Route[] = [
  { id: "home", path: (l) => `/${l}`, scrolledShot: true },
  { id: "work-services", path: (l) => `/${l}/work/services` },
  { id: "work-products", path: (l) => `/${l}/work/products` },
  { id: "work-cases", path: (l) => `/${l}/work/cases` },
  { id: "company-story", path: (l) => `/${l}/company/story` },
  { id: "company-team", path: (l) => `/${l}/company/team` },
  { id: "company-insights", path: (l) => `/${l}/company/insights` },
  { id: "products-skinarch", path: (l) => `/${l}/products/skinarch` },
  { id: "products-wiz", path: (l) => `/${l}/products/wiz` },
  { id: "products-brainarch", path: (l) => `/${l}/products/brainarch` },
  { id: "projects-skin", path: (l) => `/${l}/projects/skin` },
  { id: "projects-yumtrack", path: (l) => `/${l}/projects/yumtrack` },
  { id: "projects-ulms", path: (l) => `/${l}/projects/ulms` },
  { id: "projects-pagoda", path: (l) => `/${l}/projects/pagoda` },
  { id: "projects-lingrid", path: (l) => `/${l}/projects/lingrid` },
  { id: "projects-kindleup", path: (l) => `/${l}/projects/kindleup` },
  { id: "projects-todont", path: (l) => `/${l}/projects/todont` },
  { id: "projects-audiomint", path: (l) => `/${l}/projects/audiomint` },
  { id: "search", path: (l) => `/${l}/search` },
  // Screenshot only — a live submission sends real mail (see wos337).
  { id: "contact", path: (l) => `/${l}/contact` },
  { id: "insights-detail", path: (l) => `/${l}/company/insights`, discover: "insights-detail" },
  { id: "insights-404", path: (l) => `/${l}/insights/wos351-no-such-post`, expectStatus: 404 },
];

// Noise that is not a site defect. Calibrated against the first run.
const CONSOLE_IGNORE: RegExp[] = [
  /_vercel\/(insights|speed-insights)/i,
  /third-party cookie/i,
  /ERR_BLOCKED_BY_CLIENT/i,
];
const RESPONSE_IGNORE: RegExp[] = [/_vercel\//i];

type ReportRow = {
  route: string;
  locale: string;
  device: string;
  url: string;
  finalUrl: string;
  status: number | null;
  overflowPx: number;
  brokenImages: string[];
  consoleErrors: string[];
  failedResponses: string[];
  screenshot: string;
  scrolledScreenshot?: string;
};

const rows: ReportRow[] = [];

function saveReport() {
  // Merge with what's already on disk — Playwright restarts the worker after
  // a test failure, which resets the in-memory rows mid-run.
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  let existing: ReportRow[] = [];
  try {
    existing = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  } catch {}
  const key = (r: ReportRow) => `${r.route}|${r.locale}|${r.device}`;
  const merged = new Map(existing.map((r) => [key(r), r]));
  for (const r of rows) merged.set(key(r), r);
  fs.writeFileSync(REPORT_PATH, JSON.stringify([...merged.values()], null, 2));
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(350);
}

// Walk the page to the bottom so lazy next/image loads fire, then return to
// the top so the full-page shot starts from the resting header state.
async function lazyScroll(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, max);
    await new Promise((r) => setTimeout(r, 250));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

for (const locale of LOCALES) {
  for (const [device, viewport] of DEVICES) {
    test.describe(`${locale}/${device}`, () => {
      for (const route of ROUTES) {
        test(`${route.id} [${locale}/${device}]`, async ({ page }) => {
          test.setTimeout(90_000);

          const consoleErrors: string[] = [];
          const failedResponses: string[] = [];
          page.on("console", (msg) => {
            if (msg.type() !== "error") return;
            const text = msg.text();
            if (CONSOLE_IGNORE.some((re) => re.test(text))) return;
            consoleErrors.push(text);
          });
          page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
          page.on("response", (res) => {
            if (res.status() < 400) return;
            const url = res.url();
            if (RESPONSE_IGNORE.some((re) => re.test(url))) return;
            failedResponses.push(`${res.status()} ${url}`);
          });

          await page.setViewportSize({ ...viewport });

          const targetPath = route.path(locale);
          const res = await page.goto(targetPath, { waitUntil: "load" });
          let status = res?.status() ?? null;

          if (route.discover === "insights-detail") {
            // Fixture slugs don't exist on prod — follow the first live post
            // card instead (wos337 pattern). Static ins-N cards are reference
            // articles; prefer a DB/AISEN-backed card when one exists.
            await settle(page);
            const candidates = page.locator('.insights-item:not([id^="ins-"]) a[href], .insights-item a[href]');
            const first = candidates.first();
            if ((await candidates.count()) === 0) {
              expect.soft(false, `no insights card found to discover a detail page (${locale})`).toBeTruthy();
            } else {
              const href = await first.getAttribute("href");
              const detailRes = await page.goto(href!, { waitUntil: "load" });
              status = detailRes?.status() ?? null;
            }
          }

          const expected = route.expectStatus ?? 200;
          expect.soft(status, `status for ${targetPath}`).toBe(expected);

          await settle(page);
          await lazyScroll(page);

          // the deliberate 404 navigation is not a "failed response"
          const navFailures = failedResponses.filter(
            (f) => !(route.expectStatus === 404 && f.includes(route.path(locale))),
          );

          const overflowPx = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect.soft(overflowPx, `horizontal overflow on ${route.id}`).toBeLessThanOrEqual(0);

          const brokenImages = await page.evaluate(() =>
            Array.from(document.images)
              .filter((img) => img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width > 0)
              .map((img) => img.currentSrc || img.src),
          );
          expect.soft(brokenImages, `broken images on ${route.id}`).toEqual([]);
          expect.soft(consoleErrors, `console errors on ${route.id}`).toEqual([]);
          expect.soft(navFailures, `failed responses on ${route.id}`).toEqual([]);

          const dir = path.join(SCREENSHOT_DIR, route.id);
          fs.mkdirSync(dir, { recursive: true });
          const shot = path.join(dir, `${locale}-${device}.png`);
          await page.screenshot({ path: shot, fullPage: true });

          let scrolledShot: string | undefined;
          if (route.scrolledShot) {
            await page.evaluate(() => window.scrollTo(0, 600));
            await page.waitForTimeout(450);
            scrolledShot = path.join(dir, `${locale}-${device}--scrolled.png`);
            await page.screenshot({ path: scrolledShot, fullPage: false });
          }

          rows.push({
            route: route.id,
            locale,
            device,
            url: targetPath,
            finalUrl: page.url(),
            status,
            overflowPx,
            brokenImages,
            consoleErrors,
            failedResponses: navFailures,
            screenshot: shot,
            scrolledScreenshot: scrolledShot,
          });
          saveReport();
        });
      }
    });
  }
}
