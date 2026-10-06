import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

// Vercel sets VERCEL=1 at both build and runtime.
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Self-hosted deploy (bitbucket-pipelines.yml + deploy.sh): ships a
  // minimal .next/standalone/ + server.js instead of full node_modules,
  // so the blue/green directory swap stays small and fast.
  //
  // MUST be absent on Vercel: Vercel's Next adapter reads
  // .next/next-server.js.nft.json in onBuildComplete, and standalone mode
  // consumes those manifests into .next/standalone/ instead, so the build
  // fails with ENOENT (vercel/next.js#96646, confirmed against Next 16.3).
  ...(isVercel ? {} : { output: "standalone" as const }),
  images: {
    localPatterns: [
      {
        pathname: "/api/media/file/**",
      },
      // WOS-334: product/team photography under public/site/ moved to
      // next/image (TeamGrid.tsx, CompanyTeaser.tsx, products/[slug]).
      // localPatterns is an allowlist — /_next/image 400s on anything not
      // listed here, so this has to land before any of those components
      // switch off plain <img>.
      {
        pathname: "/site/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  // Every reader-facing page now lives under /ko or /en (WOS-314) — old
  // unprefixed links redirect instead of 404ing. "/" becomes the v3 site
  // home once that lands (Step 2+); until then it 404s under /ko, same as
  // hitting /ko directly, which is expected mid-migration on this branch.
  async redirects() {
    return [
      { source: "/", destination: "/ko", permanent: false },
      // WOS-342: detail pages moved to /insights/{slug}. The legacy Laravel
      // /posts/:slug points straight at the new home (not at /blog/:slug,
      // which would stack two 308s).
      { source: "/posts/:slug", destination: "/ko/insights/:slug", permanent: true },
      // The blog's own listing page is gone — its posts render inside the
      // Company > Insights panel (InsightsList.tsx). No :slug here, so this
      // never shadows the detail redirect below.
      { source: "/:locale(ko|en)/blog", destination: "/:locale/company/insights", permanent: true },
      { source: "/:locale(ko|en)/blog/:slug", destination: "/:locale/insights/:slug", permanent: true },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
