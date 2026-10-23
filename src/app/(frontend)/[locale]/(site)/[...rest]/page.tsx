import { notFound } from "next/navigation";

// WOS-351: catch-all for unmatched (site) URLs under a locale. Without it,
// /ko/anything-unknown never enters the (site) group, so its not-found.tsx
// boundary can't brand the 404 — Next falls back to its default page. The
// explicit sibling routes (work, company, products, ...) always win over a
// catch-all, and (blog)'s /insights/[slug] is likewise more specific.
export default function SiteCatchAll() {
  notFound();
}
