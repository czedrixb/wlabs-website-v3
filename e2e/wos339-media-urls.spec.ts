import { test, expect } from "@playwright/test";

// WOS-339: blog images were broken in both the admin and the frontend on
// Vercel. Root cause was a stale NEXT_PUBLIC_SERVER_URL on Vercel Production
// (left over from a project rename) — Payload stamped every media URL with
// a dead *.vercel.app origin that returned Vercel's own DEPLOYMENT_NOT_FOUND.
// Storage itself was never broken; every URL just pointed at the wrong host.
//
// src/lib/deployOrigins.ts now never emits an absolute serverURL on Vercel
// (relative /api/media/file/** URLs instead, resolved against whatever host
// actually served the request), so the regression this spec actually guards
// against is "a media URL points somewhere other than the host that served
// the page" — assert that directly, rather than only checking images
// render (a same-origin-by-luck bug like this one still 200s on localhost).

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const SLUG = "e2e-wos339-media-urls";
const SEED_BANNER_ALT = "W Labs 블로그 시드 배너 이미지";

function assertSameOriginOrRelative(url: string, baseURL: string) {
  if (url.startsWith("/")) return; // relative — always fine
  const parsed = new URL(url);
  expect(parsed.origin, `media URL ${url} must be same-origin as ${baseURL}`).toBe(
    new URL(baseURL).origin,
  );
}

test.describe("WOS-339: media URLs stay resolvable from the serving host", () => {
  test("GET /api/media — every url and sizes[*].url resolves against this host", async ({
    page,
    baseURL,
  }) => {
    const api = page.context().request;
    const res = await api.get("/api/media?depth=0&limit=100");
    expect(res.ok()).toBe(true);
    const { docs } = await res.json();
    expect(docs.length).toBeGreaterThan(0); // the seeded banner, at minimum

    const urls: string[] = [];
    for (const doc of docs) {
      if (doc.url) urls.push(doc.url);
      for (const size of Object.values(doc.sizes ?? {}) as Array<{ url?: string }>) {
        if (size?.url) urls.push(size.url);
      }
    }
    expect(urls.length).toBeGreaterThan(0);

    for (const url of urls) {
      assertSameOriginOrRelative(url, baseURL!);
      const file = await api.get(url);
      expect(file.status(), `GET ${url}`).toBe(200);
      expect(Number(file.headers()["content-length"] ?? 0)).toBeGreaterThan(0);
    }
  });

  test("admin media list thumbnail actually loads", async ({ page }) => {
    await page.goto("/admin/collections/media");
    await expect(page.getByRole("heading", { name: "미디어" })).toBeVisible();

    const thumb = page.locator(".thumbnail img, .file-meta img, img").first();
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    const loaded = await thumb.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    );
    expect(loaded).toBe(true);
  });

  test("existing seeded post hero image renders on the frontend", async ({ page }) => {
    await page.goto("/ko/blog/welcome-to-the-w-labs-blog");
    const hero = page.locator('img[src*="/_next/image"]').first();
    await expect(hero).toBeVisible();
    const loaded = await hero.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
    );
    expect(loaded).toBe(true);
  });

  test("new post: banner and an inline body image both render", async ({ page, baseURL }) => {
    const api = page.context().request;
    const origin = { Origin: baseURL! };

    const stale = await (
      await api.get(`/api/posts?where[slug][equals]=${SLUG}&depth=0`, { headers: origin })
    ).json();
    for (const doc of stale.docs ?? []) {
      await api.delete(`/api/posts/${doc.id}`, { headers: origin });
    }

    const mediaRes = await api.post("/api/media", {
      headers: origin,
      multipart: {
        file: { name: "e2e-wos339.png", mimeType: "image/png", buffer: PNG },
        _payload: JSON.stringify({ alt: "e2e wos-339 본문 이미지" }),
      },
    });
    expect(mediaRes.ok()).toBe(true);
    const mediaId = (await mediaRes.json()).doc.id;

    // A lexical "upload" node (body image) sitting alongside a paragraph —
    // same shape Payload's own editor emits (DecoratorBlockNode.exportJSON
    // + UploadNode's {id, fields, relationTo, value, type: "upload",
    // version: 3}), hand-authored here since there's no checked-in fixture.
    const postRes = await api.post("/api/posts", {
      headers: origin,
      data: {
        title: "E2E WOS-339 미디어 URL 회귀 테스트",
        slug: SLUG,
        banner: mediaId,
        _status: "published",
        content: {
          root: {
            type: "root",
            format: "",
            indent: 0,
            version: 1,
            direction: "ltr",
            children: [
              {
                type: "paragraph",
                format: "",
                indent: 0,
                version: 1,
                direction: "ltr",
                children: [{ type: "text", text: "본문 이미지 테스트", version: 1 }],
              },
              {
                type: "upload",
                version: 3,
                format: "",
                id: "000000000000000000000001",
                fields: {},
                relationTo: "media",
                value: mediaId,
              },
            ],
          },
        },
      },
    });
    expect(postRes.ok(), await postRes.text()).toBe(true);
    const postId = (await postRes.json()).doc.id;

    try {
      await page.goto(`/ko/blog/${SLUG}`);
      await expect(
        page.getByRole("heading", { name: "E2E WOS-339 미디어 URL 회귀 테스트" }),
      ).toBeVisible();

      const hero = page.locator('img[src*="/_next/image"]').first();
      await expect(hero).toBeVisible();
      expect(
        await hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      ).toBe(true);

      // The inline body image — rendered by postRichTextConverters'
      // `upload` override (src/lib/richText.tsx), not next/image, so no
      // /_next/image in its src.
      const bodyImg = page.locator(".post-body img").first();
      await expect(bodyImg).toBeVisible();
      expect(
        await bodyImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      ).toBe(true);
      const bodySrc = await bodyImg.getAttribute("src");
      assertSameOriginOrRelative(bodySrc!, baseURL!);
    } finally {
      await api.delete(`/api/posts/${postId}`, { headers: origin });
      await api.delete(`/api/media/${mediaId}`, { headers: origin });
    }
  });

  test("wire API banner_url is absolute and resolves", async ({ page }) => {
    const res = await page.request.get("/api/getPosts?locale=ko");
    expect(res.ok()).toBe(true);
    const posts = (await res.json()) as Array<{ slug: string; banner_url: string | null }>;
    const withBanner = posts.find((p) => p.slug === "welcome-to-the-w-labs-blog");
    expect(withBanner?.banner_url).toBeTruthy();
    expect(withBanner!.banner_url).toMatch(/^https?:\/\//);

    // Resolve the PATH against this test server, not the literal absolute
    // URL — siteUrl() legitimately resolves to the real project production
    // domain on Vercel (src/lib/siteUrl.ts), which on a live deployment is
    // the correct host but is not necessarily the host serving this test run.
    const path = new URL(withBanner!.banner_url!).pathname;
    const file = await page.request.get(path);
    expect(file.status(), `GET ${path}`).toBe(200);
  });

  test("seeded banner media has alt text (upsertBanner ran)", async ({ page }) => {
    const res = await page.request.get(
      `/api/media?where[alt][equals]=${encodeURIComponent(SEED_BANNER_ALT)}&depth=0`,
    );
    expect(res.ok()).toBe(true);
    expect((await res.json()).totalDocs).toBeGreaterThan(0);
  });
});
