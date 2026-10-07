import type { Locale } from "@/lib/locale";

// WOS-343: builds the query string for /og/route.tsx and fetches the
// Korean-capable fonts that route needs. Split out of metadata.ts/route.tsx
// so both the Metadata-object side (relative URL only) and the route
// handler (actual font bytes) share one clamp/sanitize contract.

const MAX_TITLE = 120;
const MAX_KICKER = 24;

// Built from character codes rather than a literal regex so this source
// file never has to carry raw control bytes inline.
const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  "g",
);

// Strips control characters and clamps length so a pathological title can't
// blow up the card's layout or turn the query string into an abuse vector
// (the route is unauthenticated — anyone can request any text).
function clamp(s: string, max: number): string {
  const cleaned = s.replace(CONTROL_CHARS, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export type OgImageParams = {
  title?: string;
  kicker?: string;
  locale: Locale;
};

// Relative on purpose — the caller (siteMetadata's metadataBase) absolutises
// it, inheriting siteUrl's Vercel-aware origin resolution (WOS-339) instead
// of this module guessing at one.
export function ogImageUrl({ title, kicker, locale }: OgImageParams): string {
  const params = new URLSearchParams({ l: locale });
  if (title) params.set("t", clamp(title, MAX_TITLE));
  if (kicker) params.set("k", clamp(kicker, MAX_KICKER));
  return `/og?${params.toString()}`;
}

export type LoadedFont = { name: string; data: ArrayBuffer; weight: number; style: "normal" | "italic" };

// next/og (@vercel/og) bundles exactly one font — Geist-Regular.ttf, Latin
// only — so any Korean glyph in the card renders as tofu unless a Korean
// font is supplied explicitly. next/font/google (src/lib/fonts.ts) isn't
// reusable here: it emits woff2 behind opaque build-hashed paths, and
// ImageResponse only accepts ttf/otf/woff. A full Noto Sans KR TTF is
// ~6.2MB, so this fetches Google's own CSS endpoint WITHOUT a browser
// user-agent (Google keys the response format off the UA — a recognized
// browser UA gets woff2, anything else gets truetype) and asks for only
// the glyphs this card actually renders via `text=`, which drops the
// payload to single-digit KB.
//
// `text` must be every string the card renders, not just the title: passing
// `fonts` to ImageResponse REPLACES the bundled Geist entirely, so a subset
// built from the title alone would leave "W Labs" and the kicker as tofu.
async function loadGoogleFont(
  family: string,
  weights: number[],
  text: string,
): Promise<LoadedFont[]> {
  const css2Url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weights.join(";")}&text=${encodeURIComponent(text)}`;
  const res = await fetch(css2Url, {
    // The font never depends on request data (Next's own docs call this
    // out for next/font), and the version token in the resulting gstatic
    // URL rotates independently of this code, so cache the CSS lookup too.
    next: { revalidate: 31536000 },
  });
  const css = await res.text();

  // One @font-face block per weight; this parses ALL of them, not just the
  // first match, so a multi-weight family (e.g. 500 + 700) returns every
  // weight it was asked for.
  const blocks = css.matchAll(
    /font-weight:\s*(\d+);[\s\S]*?font-style:\s*(normal|italic);[\s\S]*?src:\s*url\(([^)]+)\)\s*format\('truetype'\)/g,
  );

  const fonts: LoadedFont[] = [];
  for (const [, weight, style, url] of blocks) {
    const data = await fetch(url, { next: { revalidate: 31536000 } }).then((r) =>
      r.arrayBuffer(),
    );
    fonts.push({ name: family, data, weight: Number(weight), style: style as "normal" | "italic" });
  }
  return fonts;
}

// Loads every font the card's JSX needs. Noto Sans KR covers Korean text
// AND the ASCII "W Labs" wordmark/English titles, so one family is enough.
// Returns [] — never throws — on any failure, so a Google Fonts outage
// degrades to a title-less branded card instead of tofu or a 500.
export async function loadOgFonts(allText: string): Promise<LoadedFont[]> {
  try {
    return await loadGoogleFont("Noto Sans KR", [500, 700], allText);
  } catch {
    return [];
  }
}
