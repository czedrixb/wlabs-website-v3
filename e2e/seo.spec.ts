import { test, expect } from "@playwright/test";

// WOS-334: sitemap.xml, robots.txt, per-locale rss.xml, canonical tags and
// Organization JSON-LD — the SEO surface a static prototype never needed.
// Scoped to these new files/tags only, per the global testing policy.

test.describe("sitemap.xml", () => {
  test("200s and lists both locales plus a product slug", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    // withLocale("/", "ko") is "/ko/" (trailing slash) — the same shape the
    // site's own Home nav links already produce (Header/Footer/Masthead),
    // so this matches established convention rather than fighting it.
    expect(body).toMatch(/<loc>[^<]*\/ko\/?<\/loc>/);
    expect(body).toContain('hreflang="en"');
    expect(body).toContain("/products/skinarch");
    expect(body).toContain("/projects/");
  });
});

test.describe("robots.txt", () => {
  test("disallows /admin and /api, points at the sitemap", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Disallow:\s*\/admin/);
    expect(body).toMatch(/Disallow:\s*\/api/);
    expect(body).toContain("Sitemap:");
    expect(body).toContain("/sitemap.xml");
  });
});

test.describe("rss.xml", () => {
  for (const locale of ["ko", "en"] as const) {
    test(`/${locale}/rss.xml returns a valid feed`, async ({ page }) => {
      const res = await page.request.get(`/${locale}/rss.xml`);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("application/rss+xml");
      const body = await res.text();
      expect(body).toContain("<rss version=\"2.0\">");
      expect(body).toContain(`<language>${locale}</language>`);
      expect(body).toMatch(/<item>/);
    });
  }

  test("an unsupported locale segment 404s", async ({ page }) => {
    const res = await page.request.get("/fr/rss.xml");
    expect(res.status()).toBe(404);
  });
});

test.describe("canonical tags + Organization JSON-LD", () => {
  for (const locale of ["ko", "en"] as const) {
    test(`/${locale} carries a self-referencing canonical and valid JSON-LD`, async ({ page }) => {
      await page.goto(`/${locale}`);

      // Trailing slash matches withLocale("/", locale)'s own established
      // output — see the sitemap test's note above.
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", new RegExp(`/${locale}/?$`));

      const ldJson = page.locator('script[type="application/ld+json"]');
      const raw = await ldJson.first().textContent();
      expect(raw).toBeTruthy();
      const data = JSON.parse(raw!);
      expect(data["@type"]).toBe("Organization");
      expect(data.name).toBe("W Labs");
      expect(typeof data.url).toBe("string");
    });
  }

  test("/ko/contact carries its own canonical, not the layout's default", async ({ page }) => {
    await page.goto("/ko/contact");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/ko\/contact$/);
  });
});
