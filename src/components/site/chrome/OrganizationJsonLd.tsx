import type { Locale } from "@/lib/locale";
import { siteUrl } from "@/lib/siteUrl";

type Props = { locale: Locale; description: string };

// WOS-334: a minimal Organization JSON-LD block, rendered once by
// (site)/layout.tsx for every site route. Deliberately thin — no
// `address`, `sameAs` or `taxID`/D-U-N-S: the dictionary's own
// `chrome.legalAddr` string says those are "to be added once confirmed"
// (see src/lib/site/dictionary.generated.ts), and inventing structured
// data for unconfirmed values would be worse than omitting the fields.
export function OrganizationJsonLd({ locale, description }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "W Labs",
    url: siteUrl,
    logo: `${siteUrl}/site/logo/primary-land.svg`,
    description,
    inLanguage: locale,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
