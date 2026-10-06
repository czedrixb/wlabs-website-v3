import { test, expect } from "@playwright/test";

// WOS-332: Company's three segmented panels, replacing the WOS-314 stub.
// story ships prose + the 5-entry timeline + values + partnership CTA —
// the interactive `sp-rail` "reading log" timeline is deliberately not
// ported in this pass (see scripts/v3-content-manifest.mjs's header and
// the WOS-332 plan's M5 note).

test.describe("company: team panel", () => {
  // WOS-341 roster: Zyra/Winona departed; Francis, John Rey, Jericho and
  // Sean gained photos; Windy joined Marketing & Operations — every member
  // now has a photo, so no monogram fallback renders.
  test("22 members across 5 non-empty groups; all with photos", async ({ page }) => {
    await page.goto("/ko/company/team");
    await expect(page.locator(".team-group")).toHaveCount(5);
    await expect(page.locator(".member")).toHaveCount(22);
    await expect(page.locator(".member.has-av")).toHaveCount(22);
    await expect(page.locator(".member:not(.has-av)")).toHaveCount(0);
  });

  // WOS-341: the specific roster changes, not just the totals.
  test("WOS-341: new member photos render; departed members are gone", async ({ page }) => {
    await page.goto("/ko/company/team");
    const panel = page.locator(".team-panel");

    for (const name of ["Francis", "John Rey", "Jericho", "Sean", "Windy"]) {
      const card = panel.locator(".member", { has: page.getByRole("heading", { name, exact: true }) });
      await expect(card).toHaveClass(/has-av/);
      const img = card.locator("img");
      await card.scrollIntoViewIfNeeded();
      await expect(img).toBeVisible();
      // the photo actually loaded (not a broken src)
      await expect
        .poll(async () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }

    await expect(panel.getByText("Zyra")).toHaveCount(0);
    await expect(panel.getByText("Winona")).toHaveCount(0);
    // TeamGrid's live count reflects the amended roster
    await expect(page.locator(".team-panel .row-between .cap")).toHaveText("22명");
  });

  // WOS-341: Windy slots into Marketing & Operations directly after Gale.
  test("WOS-341: Windy is in Marketing & Operations, right after Gale", async ({ page }) => {
    await page.goto("/ko/company/team");
    const bizGroup = page.locator(".team-group", { has: page.getByText("마케팅·운영") });
    const names = await bizGroup.locator(".member h3").allTextContents();
    expect(names.indexOf("Windy")).toBe(names.indexOf("Gale") + 1);
    const windy = bizGroup.locator(".member", {
      has: page.getByRole("heading", { name: "Windy", exact: true }),
    });
    await expect(windy).toContainText("마케팅 스페셜리스트");
  });

  // WOS-341 AC: layout holds on PC, tablet and mobile.
  for (const [device, viewport] of [
    ["pc", { width: 1440, height: 900 }],
    ["tablet", { width: 834, height: 1194 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    test(`WOS-341: team grid lays out without overflow on ${device}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/ko/company/team");
      await expect(page.locator(".member")).toHaveCount(22);
      // no horizontal page overflow at this width
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await page.locator(".team-panel").screenshot({
        path: `e2e/screenshots/wos341-team-${device}.png`,
      });
    });
  }

  test("SegNav marks Team active", async ({ page }) => {
    await page.goto("/ko/company/team");
    await expect(page.locator('.seg a[aria-current="page"]')).toHaveText("팀");
  });
});

test.describe("company: insights panel", () => {
  // Scoped to the panel's 5 static news/product/case items — the deleted
  // /blog listing's posts now render here too (see
  // e2e/blog-into-insights.spec.ts), so a bare .news-item count would be
  // seed-data-dependent.
  test("5 news items render; the kind filter narrows them", async ({ page }) => {
    await page.goto("/ko/company/insights");
    await expect(
      page.locator('.news-item[data-kind="news"], .news-item[data-kind="product"], .news-item[data-kind="case"]'),
    ).toHaveCount(5);

    await page.locator(".filters-track").getByRole("button", { name: "제품 노트" }).click();
    await expect(page.locator(".news-item")).toHaveCount(1);
    await expect(page.locator(".news-item").first()).toHaveAttribute("data-kind", "product");
  });

  test("the product-note item links to Work → Products", async ({ page }) => {
    await page.goto("/ko/company/insights");
    const productNote = page.locator('.news-item[data-kind="product"]');
    await productNote.getByRole("link").click();
    await expect(page).toHaveURL(/\/ko\/work\/products$/);
  });
});

test.describe("company: story panel", () => {
  test("renders the 5-entry timeline and 4 values", async ({ page }) => {
    await page.goto("/ko/company/story");
    await expect(page.locator("ol.timeline li")).toHaveCount(5);
    await expect(page.locator(".values article")).toHaveCount(4);
    await expect(page.locator(".cta-panel")).toContainText("파트너십");
  });

  test("timeline entries reveal (.in) once scrolled into view", async ({ page }) => {
    await page.goto("/ko/company/story");
    await page.locator("ol.timeline li").first().scrollIntoViewIfNeeded();
    await expect(page.locator("ol.timeline li").first()).toHaveClass(/in/, { timeout: 3000 });
  });
});

test.describe("company: /en translates", () => {
  test("team/insights/story render English copy", async ({ page }) => {
    await page.goto("/en/company/team");
    await expect(page.locator(".member").first()).toContainText("CEO");

    await page.goto("/en/company/insights");
    await expect(page.locator(".news-item").first()).toContainText("Science Exchange");

    await page.goto("/en/company/story");
    await expect(page.locator(".cta-panel")).toContainText("Partnership");
  });
});
