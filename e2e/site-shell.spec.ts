import { test, expect, devices } from "@playwright/test";

// WOS-314 Step 4: the v3 site's chrome (Header/Masthead/TabBar/Footer/
// LangToggle) and the stub routes it navigates to. Home's real content
// (hero deck, mod-field, mod-band, mod-faq) lands in a later step — this
// only covers the shell.

test.describe("site shell: routes", () => {
  test("/ redirects to /ko, which redirects onward once a real home exists", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    expect(page.url()).toMatch(/\/ko$/);
  });

  test("an unknown locale segment 404s instead of silently falling back", async ({ page }) => {
    const res = await page.goto("/fr");
    expect(res?.status()).toBe(404);
  });

  for (const path of [
    "/ko/work/services",
    "/ko/work/products",
    "/ko/work/cases",
    "/ko/company/story",
    "/ko/company/team",
    "/ko/company/insights",
    "/ko/products/skinarch",
    "/ko/projects/yumtrack",
    "/ko/search",
    "/ko/contact",
  ]) {
    test(`${path} resolves`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }

  test("/work and /company redirect to their default panel", async ({ page }) => {
    await page.goto("/ko/work");
    expect(page.url()).toMatch(/\/ko\/work\/services$/);
    await page.goto("/ko/company");
    expect(page.url()).toMatch(/\/ko\/company\/story$/);
  });
});

test.describe("site shell: desktop chrome (1440px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("header is visible, masthead and tab bar are not", async ({ page }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator("header.header")).toBeVisible();
    await expect(page.locator(".sp-mhead")).toBeHidden();
    await expect(page.locator(".tabbar")).toBeHidden();
  });

  test("hovering a has-sub nav item reveals its submenu", async ({ page }) => {
    await page.goto("/ko/work/services");
    const workItem = page.locator("li.has-sub", { hasText: "하는 일" });
    await workItem.hover();
    await expect(workItem.locator(".sub")).toBeVisible();
    await expect(workItem.locator(".sub")).toContainText("서비스");
  });

  test("the active nav link carries aria-current and the pane publishes a notch width", async ({
    page,
  }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator('.header nav a[aria-current="page"]')).toHaveText("하는 일");
    const w = await page.locator(".header nav>ul").evaluate((el) => getComputedStyle(el).getPropertyValue("--w"));
    expect(parseFloat(w)).toBeGreaterThan(0);
  });
});

test.describe("site shell: mobile chrome (393px)", () => {
  test.use({ viewport: devices["iPhone 13"].viewport });

  test("masthead and tab bar are visible, desktop header is not", async ({ page }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator(".sp-mhead")).toBeVisible();
    await expect(page.locator(".tabbar")).toBeVisible();
    await expect(page.locator("header.header")).toBeHidden();
  });

  test("the active tab carries aria-current and the tab pane publishes a notch width", async ({
    page,
  }) => {
    await page.goto("/ko/work/services");
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveText("하는 일");
    const w = await page.locator(".tabbar").evaluate((el) => getComputedStyle(el).getPropertyValue("--w"));
    expect(parseFloat(w)).toBeGreaterThan(0);
  });
});

test.describe("site shell: language toggle", () => {
  test("switches locale while staying on the same page", async ({ page }) => {
    await page.goto("/ko/work/services");
    await page.locator(".lang-float a[lang='en']").click();
    await expect(page).toHaveURL(/\/en\/work\/services$/);
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");
  });
});
