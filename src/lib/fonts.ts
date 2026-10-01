import { Quicksand, Raleway, Noto_Sans_KR } from "next/font/google";

// The v3 site design (site/index.html in the design repo) loads these three
// from a render-blocking Google Fonts <link> — two DNS lookups plus a
// blocking stylesheet fetch before any text paints. next/font/google
// downloads the same files at build time and self-hosts them from this
// app's own origin instead, with the request eliminated entirely.
//
// Weights/subsets match the original <link> exactly:
// fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=
// Raleway:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700
//
// WOS-337: mounted as a className on the (frontend) group's root <html>
// element (src/app/(frontend)/[locale]/layout.tsx) — both (site) and
// (blog) nest under it and share it via SiteChrome, so one mount point
// covers every frontend route. It has to be on <html>, not lower: the
// ported stylesheet's --display/--body tokens (src/styles/site.css)
// reference var(--font-quicksand) etc. from :root, and a custom property
// containing a var() to something out of scope is invalid at
// computed-value time on the element that declares it — mounting these
// variables anywhere under <body> instead poisoned --display/--body right
// at :root and silently dropped every font/weight/line-height shorthand
// built on them, site-wide.
export const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

export const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

// Spread onto the (site) group's root element so descendants can resolve
// var(--font-quicksand) / var(--font-raleway) / var(--font-noto-sans-kr).
export const siteFontVariables = [
  quicksand.variable,
  raleway.variable,
  notoSansKr.variable,
].join(" ");
