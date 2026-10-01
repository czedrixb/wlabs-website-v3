import { test, expect } from "@playwright/test";

// Regression coverage for the admin's "Encountered two children with the
// same key" React warning. Root cause: _posts_v_parent_id_posts_id_fk is
// ON DELETE SET NULL, so a deleted post can leave its version rows behind
// with parent_id = NULL (latest = true). Every draft:true read (the posts
// list view, BeforeDashboard) selects _posts_v WHERE latest = true and
// returns { id: doc.parent, ...doc.version } — an orphaned row therefore
// surfaces as a doc with id: null, and Payload's <Table> falls back to the
// row index as its React key, which can collide with a real post id on the
// same page. Fixed by: a one-time purge migration
// (20261001_220000_purge_orphan_post_versions), Posts.ts's afterDelete
// sweep (purgeOrphanedVersions), and BeforeDashboard's over-fetch-then-slice.
test.describe("post versions never go parentless", () => {
  test("GET /api/posts?draft=true returns no null-id docs", async ({ request }) => {
    const res = await request.get("/api/posts?draft=true&limit=100&depth=0");
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    expect(docs.length).toBeGreaterThan(0); // seed guarantees posts exist
    for (const doc of docs) {
      expect(typeof doc.id).toBe("number");
    }
  });

  test("/admin/collections/posts renders only rows with real, unique ids", async ({ page }) => {
    await page.goto("/admin/collections/posts");
    await expect(page.getByRole("heading", { name: "포스트" })).toBeVisible();

    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible(); // seed guarantees posts exist
    const dataIds = await rows.evaluateAll((trs) => trs.map((tr) => tr.getAttribute("data-id")));
    for (const id of dataIds) {
      expect(id).toBeTruthy(); // a null-id orphan row renders data-id="" — Table's key fallback
    }
    // No duplicates — this is the actual symptom that surfaced as a React
    // "same key" warning: a null-id row's row-index-based key colliding
    // with a real post id on the same page.
    expect(new Set(dataIds).size).toBe(dataIds.length);
  });

  test("publishing then deleting a post leaves no orphaned version row behind", async ({
    request,
    baseURL,
  }) => {
    const origin = { Origin: baseURL! };
    const slug = `e2e-orphan-sweep-${Date.now()}`;

    const createRes = await request.post("/api/posts", {
      headers: origin,
      data: { title: "고아 버전 스윕 테스트", slug, _status: "published" },
    });
    expect(createRes.ok()).toBe(true);
    const postId = (await createRes.json()).doc.id;

    const deleteRes = await request.delete(`/api/posts/${postId}`, { headers: origin });
    expect(deleteRes.ok()).toBe(true);

    // purgeOrphanedVersions (Posts.ts afterDelete hook) should have swept
    // every parent-less version row, including this one's, in the same
    // request — no eventual consistency to wait out.
    const { docs } = await (
      await request.get("/api/posts?draft=true&limit=100&depth=0")
    ).json();
    for (const doc of docs) {
      expect(typeof doc.id).toBe("number");
    }
    expect(docs.some((doc: { slug: string }) => doc.slug === slug)).toBe(false);
  });
});
