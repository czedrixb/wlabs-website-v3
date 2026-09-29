import { notFound } from "next/navigation";

// Hints Next's build-time optimizer at the two real locales; on its own it
// does NOT reject anything else — dynamicParams: false only 404s params
// missing from this list for statically-generated routes. That used to be
// moot because every page under here was `force-dynamic`; since WOS-314's
// (site) group landed that's no longer true — its 10 routes declare no
// `dynamic`/`revalidate` and prerender statically at build (only (blog)'s
// two routes stay force-dynamic). Either way, an unknown segment (e.g.
// /fr/blog) would still render rather than 404 on this mechanism alone
// (dynamicParams defaults to true) — the explicit check below is the real
// enforcement, for both groups.
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Root layout for the whole (frontend) group: (blog) and (site) both nest
// under this for their <html lang>. Body styling/stylesheets and metadata
// are left to each nested layout (both now import site.css and wrap their
// pages in the shared <SiteChrome> — WOS-335) rather than applied here, so
// neither group depends on the other for its title or its class list.
export default async function LocaleRootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (locale !== "ko" && locale !== "en") notFound();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
