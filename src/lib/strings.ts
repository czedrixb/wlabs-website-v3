import type { Locale } from "@/lib/locale";

// UI chrome strings for the remaining /blog/[slug] detail page. The
// listing page this table used to also serve (eyebrow/title/lead copy,
// pagination controls) is gone — its posts now render inside Company >
// Insights (NewsList.tsx), which draws its own copy from the site
// dictionary (src/lib/site/dictionary.ts) instead of this table. See
// src/lib/locale.ts `pick` for the content (title/excerpt/body) locale
// switch, used on both that panel and the detail page.
const STRINGS = {
  ko: {
    unknownAuthor: "작성자 미상",
  },
  en: {
    unknownAuthor: "Unknown Author",
  },
} satisfies Record<Locale, Record<string, unknown>>;

export function t(locale: Locale) {
  return STRINGS[locale];
}
