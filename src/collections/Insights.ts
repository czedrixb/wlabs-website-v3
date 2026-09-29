import type { CollectionConfig } from "payload";

// WOS-333: structural site content, not articles — no drafts/versions.
// Follows Posts.ts's unnamed KO/EN-tabs split. `date` is a free-text display
// string on purpose (v3's own "2026 · 03" / "2023" vary in precision and
// aren't meant to be parsed), matching the InsightItem type this collection
// seeds from (src/lib/site/content.ts, extracted alongside this ticket).
export const Insights: CollectionConfig = {
  slug: "insights",
  labels: {
    singular: { en: "Insight", ko: "인사이트" },
    plural: { en: "Insights", ko: "인사이트" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "heading",
    defaultColumns: ["heading", "kind", "date", "order"],
    listSearchableFields: ["heading", "headingEn"],
    hideAPIURL: true,
    description: {
      ko: "회사 소개 → 인사이트 패널에 표시되는 소식·제품 노트·프로젝트 노트입니다.",
      en: "Company news, product notes and case notes shown on the Company → Insights panel.",
    },
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: { en: "Korean", ko: "한국어" },
          fields: [
            { name: "heading", type: "text", required: true, label: { en: "Heading (Korean)", ko: "제목" } },
            { name: "body", type: "textarea", label: { en: "Body (Korean)", ko: "본문" } },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            {
              name: "headingEn",
              type: "text",
              label: { en: "Heading (English)", ko: "제목 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 제목이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean heading is shown instead.",
                },
              },
            },
            {
              name: "bodyEn",
              type: "textarea",
              label: { en: "Body (English)", ko: "본문 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 본문이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean body is shown instead.",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "news",
      label: { en: "Kind", ko: "분류" },
      options: [
        { label: { en: "Company news", ko: "회사 소식" }, value: "news" },
        { label: { en: "Product note", ko: "제품 노트" }, value: "product" },
        { label: { en: "Case note", ko: "프로젝트 노트" }, value: "case" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "date",
      type: "text",
      required: true,
      label: { en: "Display date", ko: "표시 날짜" },
      admin: {
        position: "sidebar",
        description: {
          ko: "예: \"2026 · 03\" 또는 \"2023\" — 파싱 가능한 날짜가 아닌 표시용 문자열입니다.",
          en: "e.g. \"2026 · 03\" or \"2023\" — a display string, not a parseable date.",
        },
      },
    },
    {
      name: "link",
      type: "group",
      label: { en: "Link", ko: "링크" },
      admin: {
        description: {
          ko: "선택 사항입니다. 외부 링크이거나, /work/products 같은 내부 경로일 수 있습니다.",
          en: "Optional. Either an external link, or an internal path such as /work/products.",
        },
      },
      fields: [
        { name: "href", type: "text", label: { en: "URL", ko: "URL" } },
        {
          name: "external",
          type: "checkbox",
          defaultValue: false,
          label: { en: "Opens in a new tab", ko: "새 탭에서 열기" },
        },
        {
          name: "labelKey",
          type: "select",
          label: { en: "Label key", ko: "라벨 키" },
          options: [{ label: "segProducts", value: "segProducts" }],
          admin: {
            description: {
              ko: "내부 링크의 사전 라벨 키입니다 (선택).",
              en: "The dictionary label key for an internal link (optional).",
            },
          },
        },
      ],
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      label: { en: "Order", ko: "정렬 순서" },
      admin: { position: "sidebar" },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { en: "Slug", ko: "슬러그" },
      admin: { position: "sidebar" },
    },
  ],
};
