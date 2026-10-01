import { test, expect } from "@playwright/test";

// WOS-336: the remaining v3-design parity fixes, each assertion pinned to
// one of the user-reported regressions (screenshots, 2026-10-01):
// seg-tab labels/motion, the flat page ground + cream header on tabbed
// screens, page-head breathing room, the big "2022" proof stat + theme8
// field palette, real product captures, dashed project placeholders, the
// globe watermark, and the related rail's short names.

test.describe("WOS-336: segmented tabs", () => {
  test("seg labels render above the light thumb with the theme8 colors", async ({ page }) => {
    await page.goto("/ko/work/services");
    const active = page.locator('.seg a[aria-current="page"]');
    await expect(active).toHaveText("서비스");
    // The <a>s stack above the absolutely-positioned .track-pill — the bug
    // was z-index only on `>button`, which left every label painted over.
    const z = await active.evaluate((el) => getComputedStyle(el).zIndex);
    expect(z).toBe("1");
    // Active label: navy on the light pill (was #fff-on-light = invisible).
    await expect(active).toHaveCSS("color", "rgb(21, 43, 59)");
    // Idle label: muted on-navy on the dark track.
    await expect(page.locator(".seg a", { hasText: "제품" })).toHaveCSS(
      "color",
      "rgb(157, 182, 198)",
    );
    // The thumb itself is the light --on-navy pill.
    await expect(page.locator(".seg .track-pill")).toHaveCSS(
      "background-color",
      "rgb(232, 241, 246)",
    );
  });

  test("clicking a section tab slides the pill (gradual travel, not a snap)", async ({ page }) => {
    await page.goto("/ko/work/services");
    await page.waitForTimeout(500); // initial instant placement settles
    // Sample the pill's left edge every frame for ~1.2s while the click
    // lands — a snap yields ~2 distinct values, the liquid slide many.
    const [samples] = await Promise.all([
      page.evaluate(async () => {
        const pill = document.querySelector(".seg .track-pill")!;
        const out: number[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 1200) {
          out.push(pill.getBoundingClientRect().left);
          await new Promise((r) => requestAnimationFrame(r));
        }
        return out;
      }),
      page.locator(".seg a", { hasText: "프로젝트" }).click(),
    ]);
    const distinct = new Set(samples.map((v) => Math.round(v)));
    expect(samples[samples.length - 1]).toBeGreaterThan(samples[0]);
    expect(distinct.size).toBeGreaterThanOrEqual(5);
  });

  test("clicking a project filter slides that row's pill too", async ({ page }) => {
    await page.goto("/ko/work/cases");
    await page.locator(".filters-track").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const [samples] = await Promise.all([
      page.evaluate(async () => {
        const pill = document.querySelector(".filters-track .track-pill")!;
        const out: number[] = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 1200) {
          out.push(pill.getBoundingClientRect().left);
          await new Promise((r) => requestAnimationFrame(r));
        }
        return out;
      }),
      page.locator(".filters-track button", { hasText: "교육 & 학습" }).click(),
    ]);
    const distinct = new Set(samples.map((v) => Math.round(v)));
    expect(samples[samples.length - 1]).toBeGreaterThan(samples[0]);
    expect(distinct.size).toBeGreaterThanOrEqual(5);
  });

  test("the track (and its pill) survives panel navigation, so the slide can animate", async ({
    page,
  }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator(".seg .track-pill")).toHaveCount(1);
    // Tag the live pill node, navigate, and check the SAME node is still
    // there — the layout keeps SegNav mounted (the remount was what forced
    // every click into the no-anim path).
    await page.evaluate(() => {
      document.querySelector(".seg .track-pill")!.setAttribute("data-e2e-pill", "kept");
    });
    await page.locator(".seg a", { hasText: "제품" }).click();
    await expect(page).toHaveURL(/\/ko\/work\/products$/);
    await expect(page.locator('.seg .track-pill[data-e2e-pill="kept"]')).toHaveCount(1);
    // And it moved to the new active segment (left offset follows 제품).
    await expect
      .poll(async () =>
        page
          .locator(".seg .track-pill")
          .evaluate((el) => parseFloat(el.style.getPropertyValue("--l"))),
      )
      .toBeGreaterThan(0);
  });
});

test.describe("WOS-336: page ground and header", () => {
  test("body is one flat cream ground; header merges with the tab band on /work", async ({
    page,
  }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator("body")).toHaveCSS("background-image", "none");
    // On tabbed screens the header takes the seg's cream so the two sticky
    // rows read as one surface (v3 index.html:6654).
    await expect(page.locator(".header")).toHaveCSS("background-color", "rgb(244, 247, 249)");
  });

  test("home keeps the transparent header (no cream band)", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.locator(".header")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
  });

  test.describe("page-head breathing room under the 72px header", () => {
    for (const path of ["/ko/work/services", "/ko/company/story", "/ko/search"]) {
      test(`${path}`, async ({ page }) => {
        await page.goto(path);
        const eyebrow = page.locator(".page-head .eyebrow").first();
        const box = await eyebrow.boundingBox();
        // 72px header + --s4 (40px) = the eyebrow starts ~112px down; the
        // bug collapsed this to ~72px (0 visible gap).
        expect(box!.y).toBeGreaterThanOrEqual(100);
      });
    }
  });
});

test.describe("WOS-336: proof band", () => {
  test("the 2022 stat is a big cyan counter with its caption below", async ({ page }) => {
    await page.goto("/ko");
    await page.locator(".proof").scrollIntoViewIfNeeded();
    const year = page.locator('[data-count="2022"]');
    await expect(year).toHaveText("2022", { timeout: 3000 });
    const size = await year.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(30); // clamp(30px,8vw,40px), was 13px
    await expect(year).toHaveCSS("color", "rgb(79, 195, 222)"); // --cyan
    await expect(page.locator(".proof-item", { hasText: "년부터 중단 없이" })).toBeVisible();
  });
});

test.describe("WOS-336: product captures (reference thumbnails)", () => {
  test("home product cards paint the real capture into a 16:10 slot", async ({ page }) => {
    await page.goto("/ko");
    const arts = page.locator(".cards .card .art.sp-shot");
    await expect(arts).toHaveCount(3);
    const bg = await arts.first().evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("/site/img/skinarch.webp");
    const ratio = await arts
      .first()
      .evaluate((el) => el.clientWidth / el.clientHeight);
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(1.7);
  });

  test("work → products cards get the injected-style slot too", async ({ page }) => {
    await page.goto("/ko/work/products");
    const arts = page.locator(".panel .cards .card .art.sp-shot-made");
    await expect(arts).toHaveCount(3);
    const bg = await arts.nth(1).evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("/site/img/wiz.webp");
  });
});

test.describe("WOS-336: project placeholders", () => {
  test("home strip and /work/cases show the dashed Illustration slot, no artwork", async ({
    page,
  }) => {
    await page.goto("/ko");
    await page.locator("#home-projects").scrollIntoViewIfNeeded();
    await expect(page.locator("#home-projects .pcard .pvis-ph")).toHaveCount(4);
    await expect(page.locator("#home-projects .pcard .pvis svg")).toHaveCount(0);

    await page.goto("/ko/work/cases");
    await expect(page.locator(".pgrid .pcard .pvis-ph")).toHaveCount(8);
    // The ::after carries the dashed box + uppercase label.
    const label = await page
      .locator(".pgrid .pvis-ph")
      .first()
      .evaluate((el) => getComputedStyle(el, "::after").content);
    expect(label).toContain("Illustration");
  });
});

test.describe("WOS-336: globe watermark", () => {
  test("company teaser and team panel carry the teal globe mask", async ({ page }) => {
    await page.goto("/ko");
    const teaserMask = await page
      .locator(".company-teaser")
      .evaluate((el) => getComputedStyle(el, "::before").maskImage || "");
    expect(teaserMask).toContain("globe.webp");

    await page.goto("/ko/company/team");
    const teamMask = await page
      .locator(".team-panel")
      .evaluate((el) => getComputedStyle(el, "::before").maskImage || "");
    expect(teamMask).toContain("globe.webp");
  });
});

test.describe("WOS-336: related rail short names", () => {
  test("the services rail shows YumTrack, not the full marketing title", async ({ page }) => {
    await page.goto("/ko/work/services");
    const firstRail = page.locator(".svc-detail").first().locator(".rel-item");
    await expect(firstRail.first().locator("span").nth(1)).toHaveText("YumTrack");
    await expect(firstRail.nth(1).locator("span").nth(1)).toHaveText("KindleUp");
    await expect(firstRail.nth(2).locator("span").nth(1)).toHaveText("AudioMint");
  });
});

test.describe("WOS-336: company spacing", () => {
  test("the company tab bar carries the extra half-section gap off-story", async ({ page }) => {
    await page.goto("/ko/company/team");
    const mb = await page
      .locator("#company .sp-rail-tabs")
      .evaluate((el) => parseFloat(getComputedStyle(el).marginBottom));
    expect(mb).toBeGreaterThanOrEqual(32);
  });
});

test.describe("WOS-336: story reading rail", () => {
  test("band reads filters-first, with all six filter pills", async ({ page }) => {
    await page.goto("/ko/company/story");
    // Filters are the band's FIRST row (v3's shipped order), timeline under.
    await expect(page.locator(".sp-rail-band > :first-child")).toHaveClass(/sp-rail-filters/);
    const pills = page.locator(".sp-rail-filters .sp-rail-pill");
    await expect(pills).toHaveCount(6);
    await expect(pills.first()).toContainText("전체");
    await expect(pills.nth(5)).toContainText("검증");
  });

  test("the rounded page edge sits below the band on story, below the bar elsewhere", async ({
    page,
  }) => {
    await page.goto("/ko/company/story");
    // On story the tab bar's own edge is off; the ground slab carries it.
    const tabsEdge = await page
      .locator("#company .sp-rail-tabs")
      .evaluate((el) => getComputedStyle(el, "::after").display);
    expect(tabsEdge).toBe("none");
    await expect(page.locator("#company.is-story .sp-rail-ground")).toHaveCount(1);
    const groundEdge = await page
      .locator(".sp-rail-ground")
      .evaluate((el) => getComputedStyle(el, "::after").height);
    expect(parseFloat(groundEdge)).toBeGreaterThan(0);

    await page.goto("/ko/company/team");
    const tabsEdgeTeam = await page
      .locator("#company .sp-rail-tabs")
      .evaluate((el) => getComputedStyle(el, "::after").display);
    expect(tabsEdgeTeam).toBe("block");
  });

  test("scrolled, the band pins under the tab bar instead of sliding beneath it", async ({
    page,
  }) => {
    await page.goto("/ko/company/story");
    await page.waitForTimeout(600); // measureStack settles --sp-rail-top/--sp-tabs-h
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(600);
    const [tabsBottom, bandTop] = await page.evaluate(() => {
      const tabs = document.querySelector("#company .sp-rail-tabs")!.getBoundingClientRect();
      const band = document.querySelector(".sp-rail-band")!.getBoundingClientRect();
      return [tabs.bottom, band.top];
    });
    // The band's top must clear the tab bar (it used to pin at the header
    // and vanish behind the tabs).
    expect(bandTop).toBeGreaterThanOrEqual(tabsBottom - 1);
    // And the whole band (filters + timeline) stays visible.
    await expect(page.locator(".sp-rail-filters .sp-rail-pill").first()).toBeInViewport();
    await expect(page.locator(".sp-rail-scrub")).toBeInViewport();
  });
});
