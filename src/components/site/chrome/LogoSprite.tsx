import { LOGO_SPRITE_SYMBOLS } from "./logoSprite.generated";

// WOS-336: the v3 page-top SVG sprite — the two W-mark icon symbols
// (#logo-icon-black / #logo-icon-white, viewBox "0 0 91 55") that
// `<use href="#logo-icon-*">` consumers reference: Hero's dp-mark layer
// (which rendered empty before this existed — its <use> dangled) and the
// CTA panels' `.wmark` watermark. Same zero-size wrapper as the source
// (index.html:2055); `display:none` would break <use> in some engines, so
// it's parked with width/height 0 instead.
//
// The symbol markup itself is generated verbatim from the reference into
// logoSprite.generated.ts (~30 KB of path data) and injected as raw HTML —
// symbols never render on their own, so there's nothing for React to manage
// inside.
export function LogoSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: LOGO_SPRITE_SYMBOLS }}
    />
  );
}
