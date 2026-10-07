import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { siteUrl } from "@/lib/siteUrl";
import { ogImageUrl } from "@/lib/site/ogImage";

type Props = {
  locale: Locale;
  /** Locale-less path, e.g. "/work/products" — withLocale() adds the /ko or /en prefix. */
  path: string;
  title?: string;
  description?: string;
  /** "article" for an insight/blog post; every other route is the "website" default. */
  type?: "website" | "article";
  /** Article-only eyebrow (e.g. a category label) carried onto the OG card. */
  kicker?: string;
};

const SITE_NAME = "W Labs";
const OG_LOCALE: Record<Locale, string> = { ko: "ko_KR", en: "en_US" };

// WOS-343: Open Graph + Twitter Card block shared by siteMetadata() below and
// by the two route groups' own layout-level generateMetadata (which don't
// call siteMetadata at all — (site)/layout.tsx, (blog)/layout.tsx). Kept
// deliberately separate from siteMetadata so a layout fallback can carry
// metadataBase + openGraph without also claiming a canonical/alternates
// pair it doesn't own (that's the exact layout-vs-leaf-route canonical bug
// WOS-334's siteMetadata comment already warns about).
function ogAndTwitter({
  locale,
  path,
  title,
  description,
  type = "website",
  kicker,
}: Omit<Props, "path"> & { path?: string }): Pick<Metadata, "openGraph" | "twitter"> {
  const url = path !== undefined ? withLocale(path, locale) : undefined;
  const image = ogImageUrl({ title, kicker, locale });
  return {
    // title/description are deliberately omitted when undefined, not
    // defaulted here: Next's own metadata resolver backfills og:title/
    // og:description from the page's resolved <title>/description once
    // `openGraph` exists (resolve-metadata.js's postProcessMetadata), so a
    // route that passes neither (e.g. Home) still gets a correct card
    // instead of an empty one.
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      alternateLocale: OG_LOCALE[locale === "ko" ? "en" : "ko"],
      ...(url !== undefined ? { url } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: title ?? SITE_NAME }],
    },
    // card alone would actually be enough — Next infers title/description/
    // images from openGraph when twitter is present but incomplete — stated
    // explicitly here so the tag is self-documenting rather than implicit.
    twitter: { card: "summary_large_image" },
  };
}

// Layout-level fallback for routes that don't call siteMetadata at all
// ((site)/layout.tsx, (blog)/layout.tsx's own generateMetadata). No
// `alternates` here on purpose — only a leaf route's generateMetadata knows
// its own canonical path; a layout-level one would point every page in the
// group at the layout's own path, the bug WOS-334 already avoided for
// title/description and that this must not reintroduce for OG.
export function siteOpenGraphDefaults(locale: Locale, description?: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    ...ogAndTwitter({ locale, description }),
  };
}

// WOS-334: canonical + hreflang alternates for every site route. Next
// merges `alternates` from the nearest segment that declares it, so this
// is called from each leaf route's own generateMetadata rather than only
// from (site)/layout.tsx — a layout-only canonical would point every page
// at the layout's own path.
//
// WOS-343: also the single place that emits Open Graph + Twitter Card tags
// site-wide (every one of this function's 8 call sites), backed by a
// generated preview image at /og (src/app/og/route.tsx).
export function siteMetadata({ locale, path, title, description, type, kicker }: Props): Metadata {
  return {
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: withLocale(path, locale),
      languages: {
        ko: withLocale(path, "ko"),
        en: withLocale(path, "en"),
      },
    },
    ...ogAndTwitter({ locale, path, title, description, type, kicker }),
  };
}
