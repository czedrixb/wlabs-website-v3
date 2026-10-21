import type { Bilingual } from "./content";

// WOS-346: the Insights taxonomy, extracted from the deleted
// insightArticles.ts so client components (InsightsList, InsightHero) can
// import it without pulling in the server-only AISEN/Payload index. v3's
// taxonomy is three fixed categories with multi-tagging per entry; CMS posts
// join it through Posts.ts's `categories` select field, and AISEN posts map
// their category slugs onto it in insightsIndex.ts (`note`/`notes` → notes).

export type InsightCategory = "news" | "notes" | "research";

export const INSIGHT_CATEGORIES: InsightCategory[] = ["news", "notes", "research"];

// v3's INS_LABEL (:1789).
export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, Bilingual> = {
  news: { en: "News", ko: "뉴스" },
  notes: { en: "Notes", ko: "노트" },
  research: { en: "Research", ko: "리서치" },
};

export type InsightShot = { src: string; isMark?: boolean };
