/**
 * The absolute, browser-facing origin — for sitemap.xml, rss.xml, canonical
 * tags and JSON-LD, all of which need a real absolute URL.
 *
 * This is a sibling of src/lib/deployOrigins.ts's `serverURL`, not a reuse
 * of it: that value is deliberately `undefined` on a Vercel preview so
 * Payload emits relative media URLs (see that file's own comment). SEO
 * output has no such escape hatch — a sitemap entry or an og:url has to be
 * a real absolute string in every environment, preview included — so this
 * resolves independently, falling back to the preview's own `VERCEL_URL`
 * where deployOrigins.ts intentionally stops short.
 */
const https = (host?: string) => (host ? `https://${host}` : undefined);

export const siteUrl =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  https(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  https(process.env.VERCEL_URL) ||
  "http://localhost:3000";
