import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { siteUrl } from "@/lib/siteUrl";

type Props = {
  locale: Locale;
  /** Locale-less path, e.g. "/work/products" — withLocale() adds the /ko or /en prefix. */
  path: string;
  title?: string;
  description?: string;
};

// WOS-334: canonical + hreflang alternates for every site route. Next
// merges `alternates` from the nearest segment that declares it, so this
// is called from each leaf route's own generateMetadata rather than only
// from (site)/layout.tsx — a layout-only canonical would point every page
// at the layout's own path.
export function siteMetadata({ locale, path, title, description }: Props): Metadata {
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
  };
}
