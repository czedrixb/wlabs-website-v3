import { test, expect } from "@playwright/test";

// WOS-351: regression locks for the QA-sweep fixes applied on this branch.
// Ordinary public-page checks — runs in the regular chromium project (the
// admin storage state is unused), or against any live URL via E2E_BASE_URL.

test.describe("WOS-351 footer", () => {
  test("social row renders with the three account links", async ({ page }) => {
    await page.goto("/ko");
    const social = page.locator("footer .foot-social");
    await expect(social.locator('a[href="https://www.facebook.com/wsoftlabs/"]')).toHaveText(/Facebook/);
    await expect(social.locator('a[href="https://www.linkedin.com/company/w-labs-inc/posts/"]')).toHaveText(/LinkedIn/);
    await expect(social.locator('a[href="https://www.instagram.com/wsoftlabs/"]')).toHaveText(/Instagram/);
  });

  test("footer lockup is the mono ink variant, not the multicolor mark", async ({ page }) => {
    await page.goto("/ko");
    await expect(page.locator("footer .foot-lockup img")).toHaveAttribute("src", "/site/logo/land-dark.svg");
  });
});

test.describe("WOS-351 branded site 404", () => {
  test("unknown product slug renders the designed 404 with chrome, status 404", async ({ page }) => {
    const res = await page.goto("/ko/products/wos351-no-such-product");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
    await expect(page.locator(".ins-404-code")).toHaveText("404");
    // branded means inside SiteChrome — footer present
    await expect(page.locator("footer .sitemap")).toBeVisible();
  });

  test("fully unmatched EN path renders the EN 404 via the catch-all", async ({ page }) => {
    const res = await page.goto("/en/wos351-definitely-not-a-route");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator(".ins-meta code")).toContainText("/en/wos351-definitely-not-a-route");
  });

  test("known routes are untouched by the catch-all", async ({ page }) => {
    for (const path of ["/ko/work/services", "/ko/contact", "/en/company/team"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
    }
  });
});

test.describe("WOS-351 detail-page head", () => {
  test("no hairline above the first section after the prod-head", async ({ page }) => {
    await page.goto("/ko/projects/lingrid");
    const widths = await page.$$eval(".prod-sec", (secs) =>
      secs.map((s) => getComputedStyle(s).borderTopWidth),
    );
    expect(widths[0]).toBe("0px"); // the section right after .prod-head
    expect(widths.slice(1).every((w) => w === "1px")).toBe(true); // the rest keep theirs
  });
});

test.describe("WOS-351 hero callout overflow guard", () => {
  test(".ntip-box carries a max-width + ellipsis rule", async ({ page }) => {
    await page.goto("/ko");
    const guarded = await page.evaluate(() => {
      const rules: CSSStyleRule[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let list: CSSRuleList;
        try {
          list = sheet.cssRules;
        } catch {
          continue;
        }
        for (const r of Array.from(list)) if (r instanceof CSSStyleRule) rules.push(r);
      }
      const box = rules.find((r) => r.selectorText === ".ntip-box" && r.style.maxWidth);
      const label = rules.find((r) => r.selectorText === ".ntip-box .k b" && r.style.textOverflow === "ellipsis");
      return { box: box?.style.maxWidth ?? null, label: Boolean(label) };
    });
    expect(guarded.box).toContain("340px");
    expect(guarded.label).toBe(true);
  });
});

test.describe("WOS-351 insights card scrim", () => {
  test("has-shot scrim holds a light veil to the card's right edge", async ({ page }) => {
    await page.goto("/ko/company/insights");
    const card = page.locator(".insights-item.has-shot").first();
    test.skip((await card.count()) === 0, "no shot-backed card in this dataset");
    const bg = await card.evaluate((el) => getComputedStyle(el, "::before").backgroundImage);
    // the strengthened tail stops — .9 at 80% and .25 at the edge
    expect(bg).toContain("rgba(247, 250, 252, 0.9)");
    expect(bg).toContain("rgba(247, 250, 252, 0.25)");
  });
});

test.describe("WOS-351 contact topic default", () => {
  test("the Topic select opens preselected to the first topic", async ({ page }) => {
    await page.goto("/ko/contact");
    const select = page.locator("#contact-form select#c-topic");
    await expect(select).toHaveValue("general");
    // and the visible row isn't the blank placeholder
    const label = await select.evaluate((el: HTMLSelectElement) => el.selectedOptions[0]?.textContent?.trim());
    expect(label).toBeTruthy();
  });
});
