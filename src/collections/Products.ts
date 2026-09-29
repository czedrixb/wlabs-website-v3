import type { CollectionConfig } from "payload";

// WOS-333: structural site content, not articles — no drafts/versions.
// `name`/`topic` are plain strings (v3 never translates a product's own
// name, e.g. "SkinArch"); everything else bilingual follows Posts.ts's
// unnamed KO/EN-tabs split. The repeatable feats/steps/facts/rel lists
// can't fit that split, so each is one array outside the tabs with both
// languages side by side per row (see Projects.ts's `bullets` for the same
// reasoning).
export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: { en: "Product", ko: "제품" },
    plural: { en: "Products", ko: "제품" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "name",
    defaultColumns: ["name", "order"],
    listSearchableFields: ["name", "slug"],
    hideAPIURL: true,
    description: {
      ko: "Work → 제품 목록과 제품 상세 페이지에 표시되는 제품입니다.",
      en: "Products shown on the Work list and product detail pages.",
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
      name: "name",
      type: "text",
      required: true,
      label: { en: "Name", ko: "이름" },
      admin: {
        description: {
          ko: "예: SkinArch — v3는 제품명을 번역하지 않습니다.",
          en: "e.g. SkinArch — v3 never translates a product's own name.",
        },
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: { en: "Korean", ko: "한국어" },
          fields: [
            { name: "cat", type: "text", label: { en: "Category (Korean)", ko: "분류" } },
            { name: "lead", type: "textarea", required: true, label: { en: "Lead (Korean)", ko: "리드 문단" } },
            { name: "whoH", type: "text", label: { en: "\"Who\" heading (Korean)", ko: "대상 소개 제목" } },
            { name: "who", type: "textarea", label: { en: "\"Who\" body (Korean)", ko: "대상 소개 본문" } },
            {
              name: "note",
              type: "textarea",
              label: { en: "Disclaimer note (Korean)", ko: "고지 문구" },
              admin: {
                description: {
                  ko: "연구용(RUO) 고지 문구입니다. 해당 사항이 없으면 비워두세요 (예: wiz).",
                  en: "The Research-Use-Only disclaimer. Leave blank where it doesn't apply (e.g. wiz).",
                },
              },
            },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            { name: "catEn", type: "text", label: { en: "Category (English)", ko: "분류 (영문)" } },
            { name: "leadEn", type: "textarea", label: { en: "Lead (English)", ko: "리드 문단 (영문)" } },
            { name: "whoHEn", type: "text", label: { en: "\"Who\" heading (English)", ko: "대상 소개 제목 (영문)" } },
            { name: "whoEn", type: "textarea", label: { en: "\"Who\" body (English)", ko: "대상 소개 본문 (영문)" } },
            { name: "noteEn", type: "textarea", label: { en: "Disclaimer note (English)", ko: "고지 문구 (영문)" } },
          ],
        },
      ],
    },
    {
      name: "feats",
      type: "array",
      label: { en: "Features", ko: "기능" },
      fields: [
        { name: "title", type: "text", required: true, label: { en: "Title (Korean)", ko: "제목" } },
        { name: "titleEn", type: "text", label: { en: "Title (English)", ko: "제목 (영문)" } },
        { name: "body", type: "textarea", label: { en: "Body (Korean)", ko: "본문" } },
        { name: "bodyEn", type: "textarea", label: { en: "Body (English)", ko: "본문 (영문)" } },
      ],
    },
    {
      name: "steps",
      type: "array",
      label: { en: "Steps", ko: "이용 절차" },
      fields: [
        { name: "title", type: "text", required: true, label: { en: "Title (Korean)", ko: "제목" } },
        { name: "titleEn", type: "text", label: { en: "Title (English)", ko: "제목 (영문)" } },
        { name: "body", type: "textarea", label: { en: "Body (Korean)", ko: "본문" } },
        { name: "bodyEn", type: "textarea", label: { en: "Body (English)", ko: "본문 (영문)" } },
      ],
    },
    {
      name: "facts",
      type: "array",
      label: { en: "Facts", ko: "정보" },
      fields: [
        { name: "label", type: "text", required: true, label: { en: "Label (Korean)", ko: "라벨" } },
        { name: "labelEn", type: "text", label: { en: "Label (English)", ko: "라벨 (영문)" } },
        { name: "body", type: "textarea", label: { en: "Body (Korean)", ko: "본문" } },
        { name: "bodyEn", type: "textarea", label: { en: "Body (English)", ko: "본문 (영문)" } },
      ],
    },
    {
      name: "rel",
      type: "array",
      label: { en: "Related", ko: "관련 항목" },
      admin: {
        description: {
          ko: "제품 상세의 \"관련\" 레일입니다. project는 라벨이 일반 문자열, service는 한/영 라벨을 모두 입력하세요.",
          en: "The detail page's \"Related\" rail. A project's label is plain text; a service's label needs both languages.",
        },
      },
      fields: [
        {
          name: "kind",
          type: "select",
          required: true,
          options: [
            { label: { en: "Project", ko: "프로젝트" }, value: "project" },
            { label: { en: "Service", ko: "서비스" }, value: "service" },
          ],
        },
        { name: "refId", type: "text", label: { en: "Referenced id", ko: "참조 ID" } },
        { name: "abbr", type: "text", required: true, label: { en: "Abbreviation", ko: "약어" } },
        {
          name: "label",
          type: "text",
          label: { en: "Label (Korean, or plain for a project)", ko: "라벨(한국어, 프로젝트는 그대로 사용)" },
        },
        { name: "labelEn", type: "text", label: { en: "Label (English, service only)", ko: "라벨 (영문, 서비스 전용)" } },
      ],
    },
    {
      name: "teaserChips",
      type: "array",
      label: { en: "Teaser chips (English only)", ko: "티저 칩 (영문 전용)" },
      admin: {
        description: {
          ko: "Work → 제품 카드의 짧은 기술 태그입니다. v3는 이 칩을 번역하지 않습니다.",
          en: "The Work product card's short technical tags. v3 never translates these.",
        },
      },
      fields: [{ name: "chip", type: "text", required: true, label: { en: "Chip", ko: "칩" } }],
    },
    {
      name: "ruo",
      type: "checkbox",
      defaultValue: true,
      label: { en: "Research Use Only", ko: "연구용(RUO)" },
      admin: { position: "sidebar" },
    },
    {
      name: "priceKey",
      type: "select",
      required: true,
      defaultValue: "priceAsk",
      label: { en: "Price line", ko: "가격 표기" },
      options: [
        { label: { en: "Ask for pricing", ko: "가격 문의" }, value: "priceAsk" },
        { label: { en: "Monthly", ko: "월 구독" }, value: "monthly" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "topic",
      type: "text",
      required: true,
      label: { en: "Topic key", ko: "토픽 키" },
      admin: {
        position: "sidebar",
        description: { ko: "제품 페이지 내부 참조용 키입니다.", en: "Internal reference key for the product page." },
      },
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
      label: { en: "Slug (URL)", ko: "슬러그 (URL)" },
      admin: { position: "sidebar" },
    },
  ],
};
