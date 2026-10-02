/**
 * The absolute, browser-facing origin — for sitemap.xml, rss.xml, canonical
 * tags and JSON-LD, all of which need a real absolute URL.
 *
 * This is a sibling of src/lib/deployOrigins.ts's `serverURL`, not a reuse
 * of it: that value is deliberately `undefined` on Vercel (any environment)
 * so Payload emits relative media URLs (see that file's own comment). SEO
 * output has no such escape hatch — a sitemap entry or an og:url has to be
 * a real absolute string in every environment — so this resolves
 * independently.
 *
 * On Vercel, the platform's own `VERCEL_PROJECT_PRODUCTION_URL` wins over
 * the explicit var: Vercel keeps that one current when the project's domain
 * changes (custom domain or rename), while NEXT_PUBLIC_SERVER_URL is a
 * build-inlined value nobody is reliably around to update (WOS-339 — a
 * stale one was advertising a dead `*.vercel.app` domain in the sitemap,
 * canonical tags and og:url). Off Vercel there is no such platform value, so
 * the explicit var stays authoritative there, same as before.
 */
const https = (host?: string) => (host ? `https://${host}` : undefined);

export const siteUrl =
  https(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  https(process.env.VERCEL_URL) ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:3000";
