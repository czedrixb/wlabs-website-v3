// WOS-348: the one way to turn a post slug into its URL path. The slug is
// the AISEN-authored canonical identifier and may be descriptive (Korean
// included), so it must be percent-encoded on the way OUT of every link
// generator — the detail route decodeURIComponent()s it back on the way in.
// Lives alone (not in insightsIndex.ts) because client components build
// these hrefs too, and insightsIndex pulls server-only modules.
export function insightPath(slug: string): string {
  return `/insights/${encodeURIComponent(slug)}`;
}
