import { ImageResponse } from "next/og";
import { resolveLocale } from "@/lib/locale";
import { loadOgFonts } from "@/lib/site/ogImage";

// WOS-343: the branded 1200x630 preview card behind og:image / twitter:image
// for every route (src/lib/site/metadata.ts's siteMetadata()). A plain
// top-level route (not under (frontend)/[locale] or [api]) — it doesn't
// collide with either: Next resolves the static /og path before the
// dynamic [locale] segment, the same way src/app/api/contact/route.ts
// already coexists with (payload)'s [...slug] catch-all. robots.ts only
// disallows /admin and /api, so Facebook/LinkedIn/Kakao's scrapers can
// still fetch this.
//
// The wordmark renders as styled text, not the public/site/logo/*.svg mark:
// satori's <img> support needs exact intrinsic dimensions and is a common
// source of a silently blank card, and text sidesteps both that risk and
// any file-tracing gap in the standalone/Vercel output (bitbucket-
// pipelines.yml only copies .next/standalone, .next/static and public/).
//
// No `export const revalidate` / `dynamic = "force-static"` here: Next's
// route-handler ISR cache key is the pathname alone (it ignores the query
// string), so every distinct ?t= would collide on one cached PNG. Instead
// this relies on ImageResponse's own Cache-Control, which it already sets
// to "public, immutable, max-age=31536000" outside development — see
// node_modules/next/dist/compiled/@vercel/og/index.node.js.

export const runtime = "nodejs";

const W = 1200;
const H = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = resolveLocale(searchParams.get("l") ?? undefined);
  const title = searchParams.get("t") ?? undefined;
  const kicker = searchParams.get("k") ?? undefined;
  const fallbackTitle =
    locale === "ko" ? "성장과 디지털 전환의 파트너" : "Partner for growth and digital transformation";

  // Every string the card renders — see ogImage.ts's loadOgFonts comment on
  // why this has to be the full set, not just the title.
  const allText = ["W Labs", title ?? fallbackTitle, kicker].filter(Boolean).join(" ");
  const fonts = await loadOgFonts(allText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0A0D2E 0%, #12173F 60%, #1B2152 100%)",
          fontFamily: '"Noto Sans KR"',
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#00D4FF", letterSpacing: "-0.02em" }}>
            W Labs
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {kicker && (
            <span
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 500,
                color: "#00D4FF",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {kicker}
            </span>
          )}
          <span
            style={{
              display: "flex",
              fontSize: title && title.length > 60 ? 48 : 60,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#FBF6EE",
              letterSpacing: "-0.01em",
            }}
          >
            {title ?? fallbackTitle}
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: fonts.length
        ? fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight as 400 | 500 | 700, style: f.style }))
        : undefined,
    },
  );
}
