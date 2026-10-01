import { notFound } from "next/navigation";
import { siteFontVariables } from "@/lib/fonts";

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
//
// WOS-337: siteFontVariables (the three next/font CSS variables) has to
// live on <html> and NOT on some element inside <body> — site.css's
// --display/--body tokens are declared on :root (and html:lang(ko)), and a
// custom property whose value contains var(--font-quicksand) etc. is
// invalid at computed-value time on whichever element declares it if those
// variables aren't in scope there. They used to be mounted on a <div>
// inside SiteChrome instead (see that file), which meant --display/--body
// were poisoned right at :root and every font/line-height/weight shorthand
// built on them silently dropped out site-wide, on every route — the
// "wrong font on every page" bug. Mounting them here, above :root's own
// scope, is what makes Quicksand/Raleway/Noto Sans KR actually resolve.
export default async function LocaleRootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (locale !== "ko" && locale !== "en") notFound();

  return (
    <html lang={locale} className={siteFontVariables}>
      <body>{children}</body>
    </html>
  );
}
