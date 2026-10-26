import "@/styles/site.css";
import { SiteChrome } from "@/components/site/chrome/SiteChrome";
import { SiteNotFound } from "@/components/site/chrome/SiteNotFound";

// WOS-355: catches notFound() thrown by the (site)/(blog) group layouts'
// isSupportedLocale() guard (e.g. /test, /fr/insights/x — any first segment
// that isn't ko/en). A layout's own not-found.tsx sibling can't catch a
// throw from that same layout (the boundary nests inside it, same as
// error.js), so this is the PARENT segment's boundary — it fires instead of
// Next's unbranded built-in 404, which is what rendered here before this
// file existed. Because the throwing group layout never ran, SiteChrome and
// site.css have to be supplied here rather than inherited.
//
// locale="ko" is deliberate, not a placeholder: this boundary only fires for
// an INVALID locale segment, and "ko" is the same default resolveLocale()
// already falls back to everywhere else. A valid-locale 404 (e.g.
// /en/products/x) is caught one level deeper, by (site)/not-found.tsx or
// (blog)/not-found.tsx, which resolve the real locale from their own layout.
export default function LocaleNotFound() {
  return (
    <SiteChrome locale="ko">
      <SiteNotFound />
    </SiteChrome>
  );
}
