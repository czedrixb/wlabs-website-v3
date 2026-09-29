import { test, expect } from "@playwright/test";

// WOS-331: the v3 site chrome (WOS-314) + Home render entirely in Korean
// today — the language toggle only ever swapped the URL. This wires
// src/lib/site/dictionary.ts through them so /en actually translates site
// chrome and module copy, matching WOS-330's first acceptance criterion.
// site-shell.spec.ts / site-home.spec.ts already cover structure and
// behavior against /ko (unchanged by this ticket); this file is the new
// English-language coverage plus the toggle round-trip between the two.
//
// playwright.config.ts sets use.locale: "ko-KR" deliberately (WOS-312 §5/§6
// — the target editor is a Korean-locale browser). Every assertion below
// comes from the URL path, never from Accept-Language.

test.describe("site i18n: English chrome", () => {
  test("header nav, tab bar, footer sitemap and skip link render in English", async ({ page }) => {
    await page.goto("/en/work/services");

    await expect(page.locator("a.skip")).toHaveText("Skip to content");

    const nav = page.locator(".header nav");
    await expect(nav).toContainText("Work");
    await expect(nav).toContainText("Company");
    await expect(nav).toContainText("Search");
    await expect(nav).toContainText("Project Inquiry");

    const tabbar = page.locator(".tabbar");
    await expect(tabbar).toContainText("Home");
    await expect(tabbar).toContainText("Work");
    await expect(tabbar).toContainText("Company");
    await expect(tabbar).toContainText("Search");
    await expect(tabbar).toContainText("Inquiry");

    const footer = page.locator("footer");
    await expect(footer).toContainText("Services");
    await expect(footer).toContainText("Products");
    await expect(footer).toContainText("Projects");
    await expect(footer).toContainText("Our story");
    await expect(footer).toContainText("Team");
    await expect(footer).toContainText("Insights");
    await expect(footer).toContainText("Privacy policy");
    await expect(footer).toContainText("Terms");
    await expect(footer).toContainText("Partner for growth and digital transformation");
  });

  test("hovering a has-sub nav item reveals its English submenu", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/work/services");
    const workItem = page.locator("li.has-sub", { hasText: "Work" });
    await workItem.hover();
    await expect(workItem.locator(".sub")).toBeVisible();
    await expect(workItem.locator(".sub")).toContainText("Services");
    await expect(workItem.locator(".sub")).toContainText("Products");
    await expect(workItem.locator(".sub")).toContainText("Projects");
  });
});

test.describe("site i18n: English Home", () => {
  test("hero, proof band, services and FAQ render in English", async ({ page }) => {
    await page.goto("/en");

    // Hero: the markup-bearing heading splits into lead/<br>/accent/tail —
    // confirm both halves of the accent span landed, not just plain text.
    await expect(page.getByRole("heading", { name: "Complex problems" })).toBeVisible();
    await expect(page.locator(".chapter").first().locator(".accent")).toHaveText("working software");
    await expect(page.getByText("Scroll to explore")).toBeVisible();

    // Proof band — the counter-fragment fix (Step 5): the sentence reads in
    // English word order with the counter inline, not glued Korean-style.
    await page.locator(".proof").scrollIntoViewIfNeeded();
    await expect(page.locator(".stat2")).toContainText("Delivering client work continuously since");
    await expect(page.locator(".ok").first()).toContainText("Verified");

    // Services (mod-band).
    await page.locator("#home-services").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Five ways we work with you." })).toBeVisible();
    const firstBand = page.locator(".sp-band").first();
    await firstBand.locator(".sp-band-btn").click();
    await expect(firstBand.locator(".sp-band-panel")).toContainText("AI that reads documents");

    // FAQ.
    await page.locator(".sp-faq2").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Frequently asked" })).toBeVisible();
    const firstFaq = page.locator(".sp-faq2-item").first();
    await firstFaq.locator(".sp-faq2-q").click();
    await expect(firstFaq).toContainText("What does W Labs do?");
  });

  test("no Korean leaks into the English chrome", async ({ page }) => {
    await page.goto("/en");
    const bodyText = await page.locator("body").innerText();
    // legal1 keeps "더블유랩스" as v3's own English-form parenthetical
    // ("W Labs (더블유랩스) · CEO Matt Jung"). WOS-332's project strip
    // renders Pagoda's "bubbles" ProjectArt illustration, whose SVG bakes
    // in a literal "안녕하세요!" opposite "Hello!" — it's depicting a
    // bilingual chat product, not translatable UI copy, and v3's own ART
    // table carries the same hardcoded Korean regardless of page language.
    // Everything else must be Hangul-free.
    const withoutKnownArt = bodyText.replace("더블유랩스", "").replace("안녕하세요!", "");
    expect(withoutKnownArt).not.toMatch(/[가-힣]/);
  });

  test("<html lang> and <title> are locale-correct and no longer say 'blog' on a site page", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle(/Partner for growth and digital transformation/);
    expect(await page.title()).not.toMatch(/Blog/i);

    await page.goto("/ko");
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");
    await expect(page).toHaveTitle(/성장과 디지털 전환의 파트너/);
  });
});

test.describe("site i18n: toggle round-trip", () => {
  // WOS-332 replaced /work/services' stub (an <h1> that just echoed the
  // segment label "Services"/"서비스") with the real ServiceDetail panel —
  // its own <h1> is now workH1 ("Services, products and what we've built."
  // / "서비스, 제품, 그리고 만들어 온 것들."). The active SegNav link is the
  // stable "says Services/서비스" signal now.
  test("/ko -> EN -> KO keeps the same deep path and flips aria-pressed both ways", async ({ page }) => {
    await page.goto("/ko/work/services");

    await page.locator(".lang-float a[lang='en']").click();
    await expect(page).toHaveURL(/\/en\/work\/services$/);
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".lang-float a[lang='ko']")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('.seg a[aria-current="page"]')).toHaveText("Services");

    await page.locator(".lang-float a[lang='ko']").click();
    await expect(page).toHaveURL(/\/ko\/work\/services$/);
    await expect(page.locator(".lang-float a[lang='ko']")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".lang-float a[lang='en']")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('.seg a[aria-current="page"]')).toHaveText("서비스");
  });
});
