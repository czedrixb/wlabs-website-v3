import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The site favicon (src/app/icon.svg, Next.js file-convention icon) was a
// placeholder "W" zigzag mark. Swapped for the exact favicon used by the
// v3 design reference (D:\Submit\wlabs-website-v3\site\index.html) — a
// detailed W wordmark, light/dark aware via prefers-color-scheme, no
// background. This test pins the file content so it can't silently drift
// back to the placeholder, and renders it so a screenshot can confirm the
// mark itself (independent of whatever a running dev server has cached —
// Next's icon route is generated once at server start, so a live /icon.svg
// fetch can lag behind this file until the server restarts).
const ICON_PATH = path.resolve(__dirname, "../src/app/icon.svg");

test.describe("site favicon matches the v3 design reference mark", () => {
  test("icon.svg is the reference W mark, not the placeholder", () => {
    const svg = fs.readFileSync(ICON_PATH, "utf-8");
    expect(svg).toContain('viewBox="0 0 224 118"');
    expect(svg).toContain("prefers-color-scheme:dark");
    expect(svg).toContain("M216.394 0C218.389 0.000146477 220.101 1.21651");
    expect(svg).not.toContain("M6 10 L11.5 23 L16 13 L20.5 23 L26 10");
  });

  test("renders without error at favicon scale", async ({ page }) => {
    const svgUrl = `file://${ICON_PATH.replace(/\\/g, "/")}`;
    const response = await page.goto(svgUrl);
    expect(response?.ok()).toBeTruthy();
    const img = page.locator("svg, img").first();
    await expect(img).toBeVisible();
  });

  test("visual before/after vs. the old placeholder mark", async ({ page }, testInfo) => {
    const oldSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#171717"/>
  <path d="M6 10 L11.5 23 L16 13 L20.5 23 L26 10" fill="none" stroke="#fafafa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    const newSvg = fs.readFileSync(ICON_PATH, "utf-8");
    const toDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    await page.setViewportSize({ width: 760, height: 220 });
    await page.setContent(`<!doctype html>
<html><head><style>
  body { margin: 0; font-family: sans-serif; display: flex; }
  .panel { padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 180px; }
  .light { background: #f5f5f5; color: #111; }
  .dark { background: #111; color: #f5f5f5; }
  .icon-box { width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 8px; }
  .dark .icon-box { background: #000; }
  .icon-box img { max-width: 72%; max-height: 72%; }
  h3 { margin: 0; font-size: 13px; text-align: center; }
</style></head>
<body>
  <div class="panel light"><h3>OLD placeholder<br/>(light bg)</h3><div class="icon-box"><img src="${toDataUri(oldSvg)}" /></div></div>
  <div class="panel dark"><h3>OLD placeholder<br/>(dark bg)</h3><div class="icon-box"><img src="${toDataUri(oldSvg)}" /></div></div>
  <div class="panel light"><h3>NEW v3-reference mark<br/>(light bg)</h3><div class="icon-box"><img src="${toDataUri(newSvg)}" /></div></div>
  <div class="panel dark"><h3>NEW v3-reference mark<br/>(dark bg)</h3><div class="icon-box"><img src="${toDataUri(newSvg)}" /></div></div>
</body></html>`);

    await expect(page.locator("img")).toHaveCount(4);
    await page.screenshot({ path: testInfo.outputPath("favicon-compare.png") });
  });
});
