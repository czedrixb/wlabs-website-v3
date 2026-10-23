import { SiteNotFound } from "@/components/site/chrome/SiteNotFound";

// WOS-351: notFound() boundary for the (site) group — unknown product and
// project slugs, plus everything the [...rest] catch-all swallows, render
// this branded state inside SiteChrome instead of Next's default 404.
export default function SiteGroupNotFound() {
  return <SiteNotFound />;
}
