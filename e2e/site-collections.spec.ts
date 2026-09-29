import { test, expect, type Page } from "@playwright/test";
import { slugify } from "../src/lib/slugify";
import { TEAM, PROJECTS, PRODUCTS, SERVICES, FAQ, INSIGHTS } from "../src/lib/site/content";

// WOS-333: six new collections (team/projects/products/services/faq/
// insights) seeded from the typed constants at src/lib/site/content.ts —
// see src/seed/site.ts. Every collection follows Posts.ts's unnamed
// KO/EN-tabs pattern, not Payload's locale switcher (see e2e/ko-en-tabs.spec.ts
// for the pattern this mirrors, and payload.config.ts's i18n comment for why).
// This spec covers the collections themselves; the eleven existing consumers
// of @/lib/site/content are untouched by this ticket and keep their own
// site-*.spec.ts coverage.

test.describe("admin nav: site content collections", () => {
  test("all six collections appear under the 사이트 콘텐츠 group", async ({ page }) => {
    // A neutral page — not one of the six — so every link renders as a
    // real <a>, not the current-page's ownerless <div class="nav__link">.
    await page.goto("/admin/collections/media");
    const group = page.locator('[id="nav-group-사이트 콘텐츠"]');
    await expect(group).toBeVisible();

    const links: [string, string][] = [
      ["team", "팀"],
      ["projects", "프로젝트"],
      ["products", "제품"],
      ["services", "서비스"],
      ["faq", "자주 묻는 질문"],
      ["insights", "인사이트"],
    ];
    for (const [slug, label] of links) {
      await expect(group.locator(`#nav-${slug}`)).toHaveText(label);
    }
  });
});

test.describe("admin list views: seeded row counts", () => {
  const expected: [string, number][] = [
    ["team", TEAM.length],
    ["projects", PROJECTS.length],
    ["products", Object.keys(PRODUCTS).length],
    ["services", SERVICES.length],
    ["faq", FAQ.length],
    ["insights", INSIGHTS.length],
  ];

  for (const [collection, count] of expected) {
    test(`${collection} has ${count} seeded docs`, async ({ page }) => {
      const res = await page.request.get(`/api/${collection}?limit=1`);
      expect(res.status()).toBe(200);
      expect((await res.json()).totalDocs).toBe(count);
    });
  }
});

// Both language tabs, checked on load and again after a reload — a reload
// proves the second language actually round-tripped through Postgres rather
// than only existing in the form's client-side state.
async function assertBothTabs(
  page: Page,
  fields: { koField: string; koValue: string; enField: string; enValue: string },
) {
  await expect(page.locator(".localizer")).toHaveCount(0);
  const koTab = page.locator("button.tabs-field__tab-button", { hasText: "한국어" });
  const enTab = page.locator("button.tabs-field__tab-button", { hasText: "English" });
  await expect(koTab).toBeVisible();
  await expect(enTab).toBeVisible();

  // Payload persists which tab was last active per collection as a sticky
  // user preference (usePreferences' tabIndex) — it is NOT always the
  // Korean tab on load, so click explicitly rather than assume a default
  // (same convention as e2e/ko-en-tabs.spec.ts).
  await koTab.click();
  await expect(page.locator(`#field-${fields.koField}`)).toHaveValue(fields.koValue);
  await enTab.click();
  await expect(page.locator(`#field-${fields.enField}`)).toHaveValue(fields.enValue);

  await page.reload();
  await koTab.click();
  await expect(page.locator(`#field-${fields.koField}`)).toHaveValue(fields.koValue);
  await enTab.click();
  await expect(page.locator(`#field-${fields.enField}`)).toHaveValue(fields.enValue);
}

async function findId(page: Page, collection: string, where: string): Promise<number> {
  const res = await page.request.get(`/api/${collection}?${where}&limit=1`);
  const { docs } = await res.json();
  expect(docs[0]).toBeTruthy();
  return docs[0].id;
}

test.describe("admin edit view: KO/EN tabs, no locale switcher", () => {
  test("team: Matt's role shows in both tabs", async ({ page }) => {
    const matt = TEAM[0];
    const slug = slugify(matt.name);
    const id = await findId(page, "team", `where[slug][equals]=${slug}`);

    await page.goto(`/admin/collections/team/${id}`);
    await assertBothTabs(page, { koField: "role", koValue: matt.role.ko, enField: "roleEn", enValue: matt.role.en });
  });

  test("projects: ulms carries the same title on both tabs (proper noun)", async ({ page }) => {
    const ulms = PROJECTS.find((p) => p.id === "ulms");
    expect(ulms).toBeTruthy();
    // The point of this test: it's the same string twice, not a blank EN tab.
    expect(ulms!.title.ko).toBe(ulms!.title.en);

    const id = await findId(page, "projects", "where[slug][equals]=ulms");
    await page.goto(`/admin/collections/projects/${id}`);
    await assertBothTabs(page, {
      koField: "title",
      koValue: ulms!.title.ko,
      enField: "titleEn",
      enValue: ulms!.title.en,
    });
  });

  test("products: skinarch's \"who\" heading shows in both tabs", async ({ page }) => {
    const p = PRODUCTS.skinarch;
    const id = await findId(page, "products", "where[slug][equals]=skinarch");

    await page.goto(`/admin/collections/products/${id}`);
    await assertBothTabs(page, { koField: "whoH", koValue: p.whoH.ko, enField: "whoHEn", enValue: p.whoH.en });
  });

  test("services: intelligence's name shows in both tabs", async ({ page }) => {
    const svc = SERVICES.find((s) => s.id === "intelligence");
    expect(svc).toBeTruthy();
    const id = await findId(page, "services", "where[slug][equals]=intelligence");

    await page.goto(`/admin/collections/services/${id}`);
    await assertBothTabs(page, { koField: "name", koValue: svc!.name.ko, enField: "nameEn", enValue: svc!.name.en });
  });

  test("faq: the first question shows in both tabs", async ({ page }) => {
    const item = FAQ[0];
    const id = await findId(page, "faq", `where[question][equals]=${encodeURIComponent(item.q.ko)}`);

    await page.goto(`/admin/collections/faq/${id}`);
    await assertBothTabs(page, {
      koField: "question",
      koValue: item.q.ko,
      enField: "questionEn",
      enValue: item.q.en,
    });
  });

  test("insights: the first item's heading shows in both tabs", async ({ page }) => {
    const item = INSIGHTS[0];
    const id = await findId(page, "insights", `where[slug][equals]=${item.id}`);

    await page.goto(`/admin/collections/insights/${id}`);
    await assertBothTabs(page, {
      koField: "heading",
      koValue: item.heading.ko,
      enField: "headingEn",
      enValue: item.heading.en,
    });
  });
});
