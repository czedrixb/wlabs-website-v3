import { test, expect } from "@playwright/test";

// Regression: Payload returns media URLs prefixed with serverURL, and
// next/image only allows same-app media via images.localPatterns (which
// matches LOCAL paths) — the absolute URL threw "hostname is not configured
// under images" and 500'd every page with a banner. mediaPath() strips the
// origin before the URL reaches <Image>. Seed data has no banner posts, so
// this spec creates (and removes) its own.

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const SLUG = "e2e-banner-image-regression";

test("post banner renders through next/image", async ({ page, baseURL }) => {
  const api = page.context().request;
  const origin = { Origin: baseURL! };

  // Clean any leftovers from a previous aborted run.
  const stale = await (
    await api.get(`/api/posts?where[slug][equals]=${SLUG}&depth=0`, { headers: origin })
  ).json();
  for (const doc of stale.docs ?? []) {
    await api.delete(`/api/posts/${doc.id}`, { headers: origin });
  }

  const mediaRes = await api.post("/api/media", {
    headers: origin,
    multipart: {
      file: { name: "e2e-banner.png", mimeType: "image/png", buffer: PNG },
      _payload: JSON.stringify({ alt: "e2e 배너" }),
    },
  });
  expect(mediaRes.ok()).toBe(true);
  const mediaId = (await mediaRes.json()).doc.id;

  const postRes = await api.post("/api/posts", {
    headers: origin,
    data: {
      title: "E2E 배너 이미지 회귀 테스트",
      slug: SLUG,
      banner: mediaId,
      _status: "published",
    },
  });
  expect(postRes.ok()).toBe(true);
  const postId = (await postRes.json()).doc.id;

  try {
    await page.goto(`/ko/blog/${SLUG}`);
    await expect(
      page.getByRole("heading", { name: "E2E 배너 이미지 회귀 테스트" }),
    ).toBeVisible();
    const banner = page.locator('img[src*="/_next/image"]').first();
    await expect(banner).toBeVisible();
    // The optimizer must actually serve it (a broken src still "renders").
    const loaded = await banner.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    );
    expect(loaded).toBe(true);

    // The list page 500'd on the same error. The old /blog listing is gone
    // — this post's card now lives in the Company > Insights panel instead
    // — but NewsList.tsx doesn't render post banners at all (cards are
    // text + link only), so the regression can't resurface there. Not
    // asserted here: that panel is ISR-cached (company/[panel]/page.tsx's
    // `revalidate = 60`), and on-demand revalidateTag invalidation from
    // Posts.ts's afterChange hook can take a request or two to propagate —
    // a single immediate page.goto isn't a reliable window to observe it in.
  } finally {
    await api.delete(`/api/posts/${postId}`, { headers: origin });
    await api.delete(`/api/media/${mediaId}`, { headers: origin });
  }
});
