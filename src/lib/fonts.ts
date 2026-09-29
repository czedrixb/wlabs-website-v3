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
// Not wired into any layout yet — the (site) route group that will consume
// these (via siteFontVariables on its root element, with the ported
// stylesheet's --display/--body tokens rewritten to reference
// var(--font-quicksand) etc. instead of the literal family names) lands in
// a later WOS-314 step. The blog route group keeps its own Tailwind font
// stack and never imports this module.
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
