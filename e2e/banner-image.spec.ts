import { test, expect } from "@playwright/test";

// WOS-342 reshaped this regression's surface: the detail page no longer
// renders the banner through next/image above the article — the banner now
// paints the navy hero itself, as the `--shot` CSS background on
// .ins-hero>.ins-shot (InsightHero.tsx). What still matters from the
// original WOS-339 regression is that the URL reaching the browser is the
// LOCAL /api/media path (mediaPath() strips Payload's serverURL origin) and
// that it actually serves. Seed data has no banner posts, so this spec
// creates (and removes) its own.

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const SLUG = "e2e-banner-image-regression";

test("post banner paints the insight hero's shot layer", async ({ page, baseURL }) => {
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
    await page.goto(`/ko/insights/${SLUG}`);
    await expect(
      page.getByRole("heading", { name: "E2E 배너 이미지 회귀 테스트" }),
    ).toBeVisible();

    const hero = page.locator(".ins-hero.has-shot");
    await expect(hero).toBeVisible();

    // The shot layer must carry a LOCAL media URL (mediaPath stripped the
    // serverURL origin) …
    const shotUrl = await hero.locator(".ins-shot").evaluate((el) => {
      const m = /url\("?([^")]+)"?\)/.exec(getComputedStyle(el).backgroundImage);
      return m ? m[1] : null;
    });
    expect(shotUrl).toBeTruthy();
    expect(shotUrl!).toMatch(/\/api\/media\//);
    expect(new URL(shotUrl!, baseURL).origin).toBe(new URL(baseURL!).origin);

    // … and it must actually serve (a broken background still "renders").
    const res = await api.get(shotUrl!);
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toMatch(/^image\//);
  } finally {
    await api.delete(`/api/posts/${postId}`, { headers: origin });
    await api.delete(`/api/media/${mediaId}`, { headers: origin });
  }
});
