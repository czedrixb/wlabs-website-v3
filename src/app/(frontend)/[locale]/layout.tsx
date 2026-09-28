import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "W Labs Blog",
  description: "W Labs blog — standalone prototype (WOS-313)",
};

// Hints Next's build-time optimizer at the two real locales; on its own it
// does NOT reject anything else — dynamicParams: false only 404s params
// missing from this list for statically-generated routes, and every page
// under here is `export const dynamic = "force-dynamic"` (fresh data on
// every request), which opts out of that mechanism entirely. An unknown
// segment (e.g. /fr/blog) would render anyway, with whatever `lang` came in
// on the URL. The explicit check below is the real enforcement.
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Root layout for the whole (frontend) group: the blog and, once WOS-314's
// v3 port lands, the site shell both nest under this for their <html lang>.
// Body styling/stylesheets are left to each nested layout ((blog) uses
// Tailwind; the future (site) group brings its own tokens) rather than
// applied here, so the two can never fight over one shared body class list.
export default async function LocaleRootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (locale !== "ko" && locale !== "en") notFound();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
