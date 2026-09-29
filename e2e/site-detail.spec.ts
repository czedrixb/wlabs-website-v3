import { test, expect } from "@playwright/test";
import { PROJECTS, PRODUCTS } from "../src/lib/site/content";

// WOS-332: /products/[slug] and /projects/[slug], replacing the WOS-314
// stub (`<h1>{slug}</h1>`). Ported from v3's renderProduct()/
// renderProjectPage() as server components — every slug is statically
// generated (generateStaticParams), an unknown slug 404s.

test.describe("product detail pages", () => {
  for (const id of Object.keys(PRODUCTS)) {
    test(`${id} renders its own name, capabilities and workflow`, async ({ page }) => {
      const res = await page.goto(`/ko/products/${id}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: PRODUCTS[id as keyof typeof PRODUCTS].name })).toBeVisible();
      await expect(page.locator(".feat")).toHaveCount(PRODUCTS[id as keyof typeof PRODUCTS].feats.length);
      await expect(page.locator(".step")).toHaveCount(3);
    });
  }

  test("a bad slug 404s instead of falling back to the first product", async ({ page }) => {
    const res = await page.goto("/ko/products/not-a-real-product");
    expect(res?.status()).toBe(404);
  });

  test("the Related rail resolves to a real project or service route", async ({ page }) => {
    await page.goto("/ko/products/skinarch");
    const rel = page.locator(".prod-rel .rel-item").first();
    await expect(rel).toHaveAttribute("href", /^\/ko\/(projects|work\/services)/);
  });

  test("/en renders English lead copy", async ({ page }) => {
    await page.goto("/en/products/wiz");
    await expect(page.locator(".lead").first()).toContainText("AI service assistant");
  });
});

test.describe("project detail pages", () => {
  test("every project slug resolves with its own title", async ({ page }) => {
    for (const p of PROJECTS) {
      const res = await page.goto(`/ko/projects/${p.id}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: p.title.ko })).toBeVisible();
    }
  });

  test("a bad slug 404s", async ({ page }) => {
    const res = await page.goto("/ko/projects/not-a-real-project");
    expect(res?.status()).toBe(404);
  });

  test("prev/next nav wraps around the project list", async ({ page }) => {
    // PROJECTS[0] is 'skin' — its "previous" should wrap to the last entry.
    await page.goto(`/ko/projects/${PROJECTS[0].id}`);
    const prevHref = await page.locator(".proj-nav a").first().getAttribute("href");
    expect(prevHref).toBe(`/ko/projects/${PROJECTS[PROJECTS.length - 1].id}`);
  });

  test("the scope-of-work list matches the project's own bullet count", async ({ page }) => {
    const p = PROJECTS[0];
    await page.goto(`/ko/projects/${p.id}`);
    await expect(page.locator(".feats .feat")).toHaveCount(p.list.length);
  });

  test("/en renders English copy and title", async ({ page }) => {
    const p = PROJECTS.find((x) => x.id === "yumtrack")!;
    await page.goto("/en/projects/yumtrack");
    await expect(page.getByRole("heading", { level: 1, name: p.title.en })).toBeVisible();
  });
});
