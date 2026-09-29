import type { Locale } from "@/lib/locale";

// UI chrome strings only — post content (title/excerpt/body) is not part of
// this table and always renders in Korean regardless of locale. See
// src/lib/locale.ts `pick` for the (separate) API-side content switch.
const STRINGS = {
  ko: {
    noPosts: "아직 게시글이 없습니다.",
    previous: "이전",
    next: "다음",
    pageIndicator: (page: number, total: number) => `${total}페이지 중 ${page}페이지`,
    unknownAuthor: "작성자 미상",
    // WOS-335: list-page heading copy, added when the blog adopted the v3
    // site's chrome/page-head pattern (see (site)/work/[panel]/page.tsx).
    blogEyebrow: "인사이트",
    blogTitle: "블로그",
    blogLead: "W Labs 팀의 기술 노트와 소식을 전합니다.",
  },
  en: {
    noPosts: "No posts yet.",
    previous: "Previous",
    next: "Next",
    pageIndicator: (page: number, total: number) => `Page ${page} of ${total}`,
    unknownAuthor: "Unknown Author",
    blogEyebrow: "Insights",
    blogTitle: "Blog",
    blogLead: "Engineering notes and updates from the W Labs team.",
  },
} satisfies Record<Locale, Record<string, unknown>>;

export function t(locale: Locale) {
  return STRINGS[locale];
}
