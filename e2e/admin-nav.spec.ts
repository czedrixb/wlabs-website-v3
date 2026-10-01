import { test, expect } from "@playwright/test";

// WOS-337: the admin used to list ten collections — Posts, Media, Users,
// plus six write-only "Site content" collections (Team/Projects/Products/
// Services/Faq/Insights, seeded from src/lib/site/content.ts but never read
// back by any page) and Inquiries (the contact form's only writer, since
// removed too — see src/app/api/contact/route.ts). This asserts the admin
// nav now shows only the three collections the app actually uses.
test.describe("admin nav: trimmed to Posts, Media, Users", () => {
  test("Posts, Media and Users are the only collection links in the sidebar", async ({ page }) => {
    // Payload IDs each nav entry #nav-<slug> and renders the current
    // collection's own entry as a plain <div> (no href) rather than an
    // <a> — land on Posts so Media and Users still render as real links.
    await page.goto("/admin/collections/posts");
    const nav = page.getByRole("navigation").first();

    await expect(nav.locator("#nav-posts")).toHaveText("포스트");
    await expect(nav.locator("#nav-media")).toHaveAttribute("href", "/admin/collections/media");
    await expect(nav.locator("#nav-users")).toHaveAttribute("href", "/admin/collections/users");

    // The six "Site content" collections used to share a "사이트 콘텐츠"
    // nav-group div; Inquiries had its own "문의" group. Neither should
    // exist any more — only the base, ungrouped collections group is left.
    // Payload IDs a nav group as `nav-group-${label}` using the *translated*
    // label (see @payloadcms/ui's NavGroup component), so key off the
    // group's own label text instead of hardcoding the Korean string into
    // the selector. The group div also wraps its nav-item children, so
    // scope the text check to .nav-group__label rather than the whole div.
    const navGroups = page.locator('[id^="nav-group-"]');
    await expect(navGroups).toHaveCount(1);
    await expect(navGroups.first()).toBeVisible();
    await expect(navGroups.first().locator(".nav-group__label")).toHaveText("컬렉션");

    for (const slug of ["team", "projects", "products", "services", "faq", "insights", "inquiries"]) {
      await expect(nav.locator(`#nav-${slug}`)).toHaveCount(0);
    }
  });

  test("the removed collection routes 404", async ({ page }) => {
    for (const slug of ["team", "projects", "products", "services", "faq", "insights", "inquiries"]) {
      const res = await page.goto(`/admin/collections/${slug}`);
      expect(res?.status(), `/admin/collections/${slug}`).toBe(404);
    }
  });
});
