import type { AisenImage } from "@/lib/aisen";
import type { ResolvedFigure } from "@/components/site/insights/InsightFigures";

// WOS-347: split an AISEN post's body images into their two presentations.
// Every inline <img> (plus the <p><em>…</em></p> caption paragraph AISEN's
// TipTap serializer emits right after it) is wrapped into
// <figure class="ins-inline-fig">, which site.css hides at ≥900px, and the
// same figures are returned for the sticky rail, which hides below 900px —
// so each image is visible exactly once at any viewport. The rail list is
// the inline occurrences in document order, NOT images[] minus the cover:
// a post's cover URL can legitimately also appear in the body (ins-4 does),
// and images[] serves only as the width/height lookup the HTML lacks.
//
// content_html is sanitised by AISEN on save (Blog-integration §9), so the
// transform re-emits captured substrings verbatim — it only ever wraps
// existing markup, never writes decoded text back into the page. If AISEN's
// caption convention changes, the failure mode is graceful: the paragraph
// stays in the prose and the img's alt becomes the rail caption.

// Pre-load layout estimate when images[] has no entry for a src; 1200 is the
// lightbox width budget (.lbox img), and every render context sizes with
// width:100%/height:auto, so a wrong ratio never affects the final layout.
const FALLBACK_W = 1200;
const FALLBACK_H = 800;

// Minimal decode for sanitised attribute/text values leaving the HTML
// context (React props, images[] URL lookup). &amp; must be last.
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag);
  return m ? (m[1] ?? m[2] ?? "") : null;
}

export function extractAisenFigures(
  contentHtml: string,
  images: AisenImage[],
): { html: string; figs: ResolvedFigure[] } {
  const byUrl = new Map(images.map((i) => [i.url, i]));
  const figs: ResolvedFigure[] = [];

  const html = contentHtml.replace(
    /(<img\b[^>]*?>)(?:\s*<p>\s*<em>([\s\S]*?)<\/em>\s*<\/p>)?/g,
    (match, imgTag: string, captionHtml: string | undefined) => {
      const src = attr(imgTag, "src");
      // A src-less img can't be a rail figure either — leaving it unwrapped
      // and unpushed keeps the exactly-once invariant in both directions.
      if (!src) return match;

      const srcDecoded = decodeEntities(src);
      const alt = decodeEntities(attr(imgTag, "alt") ?? "");
      const dims = byUrl.get(srcDecoded);
      const width = dims?.width ?? FALLBACK_W;
      const height = dims?.height ?? FALLBACK_H;
      const caption =
        captionHtml !== undefined
          ? decodeEntities(stripTags(captionHtml)).trim() || alt
          : alt;

      figs.push({ src: srcDecoded, width, height, caption });

      let out = imgTag;
      const inject: string[] = [];
      if (!/\bwidth\s*=/.test(out)) inject.push(`width="${width}"`);
      if (!/\bheight\s*=/.test(out)) inject.push(`height="${height}"`);
      if (!/\bloading\s*=/.test(out)) inject.push(`loading="lazy"`);
      if (inject.length) out = out.replace(/\s*\/?>$/, (end) => ` ${inject.join(" ")}${end}`);

      return captionHtml !== undefined
        ? `<figure class="ins-inline-fig">${out}<figcaption>${captionHtml}</figcaption></figure>`
        : `<figure class="ins-inline-fig">${out}</figure>`;
    },
  );

  return { html, figs };
}
