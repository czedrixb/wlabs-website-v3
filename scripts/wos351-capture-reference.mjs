// WOS-351: capture Karlo's design reference (the self-contained
// wlabs-website-v3 build) at the same routes × languages × viewports as the
// deployed-site sweep (e2e/wos351-qa-sweep.spec.ts), so implementation and
// reference screenshots pair up mechanically by subpath.
//
//   node scripts/wos351-capture-reference.mjs --out <refDir> [--impl <implDir>] [--index]
//
// --index writes a compare.html next to the two directories with impl | ref
// pairs per route/lang/device for fast eyeballing.
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const OUT = argValue("--out") || "e2e/screenshots/wos351-ref";
const IMPL = argValue("--impl");
const WRITE_INDEX = args.includes("--index");
const REF_URL =
  argValue("--ref") || "file:///D:/Submit/wlabs-website-v3/site/index.html";

const DEVICES = [
  ["pc", { width: 1440, height: 900 }],
  ["tablet", { width: 834, height: 1194 }],
  ["mobile", { width: 390, height: 844 }],
];
const LANGS = ["ko", "en"];

// routeId -> reference hash route. Ids mirror the sweep spec; insights-404
// has no reference state. Project/product ids are identical in both repos.
const ROUTES = [
  ["home", "#home", { scrolledShot: true }],
  ["work-services", "#work/services"],
  ["work-products", "#work/products"],
  ["work-cases", "#work/cases"],
  ["company-story", "#company/story"],
  ["company-team", "#company/team"],
  ["company-insights", "#company/insights"],
  ["products-skinarch", "#product/skinarch"],
  ["products-wiz", "#product/wiz"],
  ["products-brainarch", "#product/brainarch"],
  ["projects-skin", "#project/skin"],
  ["projects-yumtrack", "#project/yumtrack"],
  ["projects-ulms", "#project/ulms"],
  ["projects-pagoda", "#project/pagoda"],
  ["projects-lingrid", "#project/lingrid"],
  ["projects-kindleup", "#project/kindleup"],
  ["projects-todont", "#project/todont"],
  ["projects-audiomint", "#project/audiomint"],
  ["search", "#search"],
  ["contact", "#contact"],
  ["insights-detail", "#insight/ins-1"],
];

async function lazyScroll(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, max);
    await new Promise((r) => setTimeout(r, 200));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
for (const lang of LANGS) {
  const context = await browser.newContext();
  // The reference reads wl-lang at init (index.html:3751); set it explicitly
  // for both languages — the markup default is not trustworthy.
  await context.addInitScript((l) => {
    try {
      localStorage.setItem("wl-lang", l);
    } catch {}
  }, lang);
  const page = await context.newPage();
  for (const [device, viewport] of DEVICES) {
    await page.setViewportSize(viewport);
    for (const [routeId, hash, opts] of ROUTES) {
      // fresh load per route — the router resolves the hash at init
      await page.goto(`${REF_URL}${hash}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.waitForTimeout(400);
      await lazyScroll(page);
      const dir = path.join(OUT, routeId);
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `${lang}-${device}.png`), fullPage: true });
      if (opts?.scrolledShot) {
        await page.evaluate(() => window.scrollTo(0, 600));
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(dir, `${lang}-${device}--scrolled.png`),
          fullPage: false,
        });
      }
      console.log(`ref ${routeId} ${lang}/${device}`);
    }
  }
  await context.close();
}
await browser.close();

if (WRITE_INDEX && IMPL) {
  const base = path.dirname(path.resolve(OUT));
  const rel = (p) => path.relative(base, p).split(path.sep).join("/");
  const blocks = [];
  for (const [routeId, , opts] of ROUTES.concat([["insights-404", null]])) {
    for (const lang of LANGS) {
      for (const [device] of DEVICES) {
        const names = [`${lang}-${device}.png`];
        if (opts?.scrolledShot) names.push(`${lang}-${device}--scrolled.png`);
        for (const name of names) {
          const impl = path.join(IMPL, routeId, name);
          const ref = path.join(OUT, routeId, name);
          const implTag = fs.existsSync(impl)
            ? `<a href="${rel(impl)}"><img loading="lazy" src="${rel(impl)}"></a>`
            : "<em>missing</em>";
          const refTag = fs.existsSync(ref)
            ? `<a href="${rel(ref)}"><img loading="lazy" src="${rel(ref)}"></a>`
            : "<em>no reference</em>";
          blocks.push(
            `<section><h2>${routeId} — ${name.replace(".png", "")}</h2>` +
              `<div class="pair"><div><h3>implementation</h3>${implTag}</div>` +
              `<div><h3>reference</h3>${refTag}</div></div></section>`,
          );
        }
      }
    }
  }
  const html = `<!doctype html><meta charset="utf-8"><title>WOS-351 impl vs ref</title>
<style>body{font-family:sans-serif;margin:16px}h2{margin:24px 0 4px;font-size:15px}
h3{margin:4px 0;font-size:12px;color:#666}.pair{display:flex;gap:8px;align-items:flex-start}
.pair>div{flex:1;min-width:0}img{width:100%;border:1px solid #ccc}</style>
${blocks.join("\n")}`;
  fs.writeFileSync(path.join(base, "compare.html"), html);
  console.log(`index: ${path.join(base, "compare.html")}`);
}
