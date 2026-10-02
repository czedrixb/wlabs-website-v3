/**
 * Payload's CSRF origin allowlist (`csrf`) is in serverOnlyConfigProperties —
 * it never reaches the client — and `serverURL` is sent to the client as part
 * of the per-request config, not inlined at build time. Only NEXT_PUBLIC_*
 * values are baked in by `next build`. That means both `serverURL` and
 * `csrf` can safely be driven by plain VERCEL_* runtime vars, which is
 * exactly what's needed: a build-inlined value can never match a Vercel
 * preview's random *.vercel.app hostname (WOS-324) — and, as WOS-339 found,
 * it can just as easily go stale against *production*'s own hostname after a
 * project rename, silently stamping a dead domain onto every media URL
 * (admin thumbnails, post body images, the wire API) until something on
 * Vercel is manually repointed. Deriving the origin at runtime instead means
 * there's nothing on Vercel left to go stale.
 *
 * Requires Vercel → Project Settings → Environment Variables →
 * "Enable access to System Environment Variables".
 */
const https = (host?: string) => (host ? `https://${host}` : undefined);

const explicit = process.env.NEXT_PUBLIC_SERVER_URL || undefined;

const vercelOrigins = [
  https(process.env.VERCEL_PROJECT_PRODUCTION_URL), // stable prod domain
  https(process.env.VERCEL_BRANCH_URL), // stable per-branch preview domain
  https(process.env.VERCEL_URL), // this exact deployment
].filter((origin): origin is string => Boolean(origin));

/**
 * On Vercel (any environment — production or preview): always undefined,
 * regardless of `explicit`. Payload then emits RELATIVE media URLs
 * (/api/media/file/**), exactly what mediaPath() and next.config.ts's
 * images.localPatterns expect, and derives the request origin from the Host
 * header — permitted only because that origin is present in csrfOrigins
 * below, so this doesn't reopen the CSRF hole it's meant to close. This also
 * means `explicit` has no effect on Vercel at all; it only matters off
 * Vercel (the VM deploy, local dev, Playwright's webServer), where there is
 * no project to rename out from under it.
 *
 * Off Vercel: the explicit NEXT_PUBLIC_SERVER_URL, unchanged from before.
 */
export const serverURL = process.env.VERCEL ? undefined : explicit;

export const csrfOrigins = [
  explicit,
  ...vercelOrigins,
  // Local dev spellings — Payload's Origin check is an exact string match.
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter((origin): origin is string => Boolean(origin));

if (process.env.VERCEL && vercelOrigins.length === 0) {
  // Every VERCEL_* var above is unset — almost always because "Enable
  // access to System Environment Variables" is off in the dashboard, not
  // because the deploy itself is broken. Without it, csrfOrigins resolves to
  // just `explicit` (or nothing), so every admin write 403s with no
  // admin-visible reason — the exact failure mode this file's CSRF comment
  // warns about, just triggered from the opposite direction. Warn, don't
  // throw: this module is imported by every route (same reasoning as the
  // S3_BUCKET guard in src/payload.config.ts).
  console.error(
    "No VERCEL_* origin resolved on a Vercel deploy — check 'Enable access to System Environment Variables' in Project Settings.",
  );
}
