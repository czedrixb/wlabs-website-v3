"use client";

import { useEffect } from "react";

// Catches server-render failures for the public blog pages (e.g. Postgres
// unreachable, WOS-329) so visitors get a retry page instead of Next's raw
// production 500. Rendered client-side without a locale, so the copy is
// bilingual ko-first like the rest of the site chrome.
//
// Lives beside (blog)'s own layout.tsx rather than up at [locale] — an
// error boundary swaps out its layout's subtree, so if it sat above
// (blog)/layout.tsx it would render without site.css (or <SiteChrome>)
// ever having loaded. Because it replaces the *page*, not the layout,
// <SiteChrome>'s own <main id="main"> is already on screen — this renders
// a plain <div>, not another <main>, so the two don't nest (WOS-335).
export default function BlogError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap section" style={{ display: "grid", justifyItems: "center", gap: "var(--s2)", textAlign: "center" }}>
      <h1 style={{ fontSize: "var(--fs-h2)" }}>일시적인 오류가 발생했습니다</h1>
      <p className="lead">Something went wrong while loading the blog.</p>
      <p className="cap">잠시 후 다시 시도해 주세요. / Please try again in a moment.</p>
      <button type="button" onClick={() => retry()} className="btn btn-primary">
        다시 시도 / Try again
      </button>
      {error.digest && <p className="cap">Error {error.digest}</p>}
    </div>
  );
}
