import type { CollectionConfig } from "payload";

// WOS-333: structural site content, not articles — no drafts/versions.
// `body`/`blurb` aren't in the SERVICES constant at all — they live in the
// dictionary as work.d1..d5 / band.svc1..5, joined by array index (see
// src/lib/site/content.ts's header comment on the split). The seed joins
// both sources for these two fields; every other field comes straight off
// SERVICES.
export const Services: CollectionConfig = {
  slug: "services",
  labels: {
    singular: { en: "Service", ko: "서비스" },
    plural: { en: "Services", ko: "서비스" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "name",
    defaultColumns: ["name", "number", "order"],
    listSearchableFields: ["name", "nameEn", "slug"],
    hideAPIURL: true,
    description: {
      ko: "Work → 서비스 패널과 제품·프로젝트 상세의 \"관련\" 레일이 참조하는 서비스입니다.",
      en: "Services the Work panel and the product/project \"Related\" rails reference.",
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
            { name: "name", type: "text", required: true, label: { en: "Name (Korean)", ko: "이름" } },
            {
              name: "body",
              type: "textarea",
              label: { en: "Body (Korean)", ko: "본문" },
              admin: {
                description: {
                  ko: "svc-detail 화면의 본문 문단입니다.",
                  en: "The svc-detail view's main body paragraph.",
                },
              },
            },
            {
              name: "blurb",
              type: "textarea",
              label: { en: "Blurb (Korean)", ko: "짧은 소개" },
              admin: {
                description: {
                  ko: "Work → 서비스 패널의 밴드에 표시되는 짧은 소개입니다.",
                  en: "The short teaser shown on the Work panel's band.",
                },
              },
            },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            { name: "nameEn", type: "text", label: { en: "Name (English)", ko: "이름 (영문)" } },
            { name: "bodyEn", type: "textarea", label: { en: "Body (English)", ko: "본문 (영문)" } },
            { name: "blurbEn", type: "textarea", label: { en: "Blurb (English)", ko: "짧은 소개 (영문)" } },
          ],
        },
      ],
    },
    {
      name: "related",
      type: "array",
      label: { en: "Related", ko: "관련 항목" },
      admin: {
        description: {
          ko: "svc-detail의 \"관련\" 레일입니다. static 항목만 자체 라벨(한/영)을 입력하세요.",
          en: "The svc-detail view's \"Related\" rail. Only a static entry carries its own label (both languages).",
        },
      },
      fields: [
        {
          name: "kind",
          type: "select",
          required: true,
          options: [
            { label: { en: "Project", ko: "프로젝트" }, value: "project" },
            { label: { en: "Product", ko: "제품" }, value: "product" },
            { label: { en: "Static (undisclosed)", ko: "고정 (고객사명 비공개)" }, value: "static" },
          ],
        },
        { name: "refId", type: "text", label: { en: "Referenced id", ko: "참조 ID" } },
        { name: "abbr", type: "text", required: true, label: { en: "Abbreviation", ko: "약어" } },
        { name: "label", type: "text", label: { en: "Label (Korean, static only)", ko: "라벨 (한국어, static 전용)" } },
        { name: "labelEn", type: "text", label: { en: "Label (English, static only)", ko: "라벨 (영문, static 전용)" } },
      ],
    },
    {
      name: "chips",
      type: "array",
      label: { en: "Chips (English only)", ko: "칩 (영문 전용)" },
      admin: {
        description: {
          ko: "svc-detail 본문 아래의 영문 전용 기술 태그입니다.",
          en: "The English-only technical-term chips shown under the svc-detail body.",
        },
      },
      fields: [{ name: "chip", type: "text", required: true, label: { en: "Chip", ko: "칩" } }],
    },
    {
      name: "relatedCaption",
      type: "select",
      required: true,
      defaultValue: "relatedLabel",
      label: { en: "Related caption", ko: "관련 레일 캡션" },
      options: [
        { label: "relatedLabel", value: "relatedLabel" },
        { label: "relatedProducts", value: "relatedProducts" },
      ],
      admin: {
        position: "sidebar",
        description: {
          ko: "\"관련\" 레일 캡션에 쓰이는 사전 키입니다.",
          en: "The dictionary key the \"Related\" rail's caption uses.",
        },
      },
    },
    { name: "number", type: "text", required: true, label: { en: "Number", ko: "번호" }, admin: { position: "sidebar" } },
    { name: "code", type: "text", required: true, label: { en: "Code", ko: "코드" }, admin: { position: "sidebar" } },
    { name: "abbr", type: "text", required: true, label: { en: "Abbreviation", ko: "약어" }, admin: { position: "sidebar" } },
    {
      name: "anchor",
      type: "text",
      required: true,
      label: { en: "Anchor", ko: "앵커" },
      admin: {
        position: "sidebar",
        description: { ko: "Work 서비스 패널이 스크롤할 #svc-* id입니다.", en: "The #svc-* id the Work services panel anchors to." },
      },
    },
    {
      name: "weight",
      type: "number",
      label: { en: "Weight", ko: "가중치" },
      admin: {
        position: "sidebar",
        description: {
          ko: "SpectrogramStack 밴드 가중치입니다. insight만 1에서 벗어납니다.",
          en: "SpectrogramStack band weight — only \"insight\" deviates from 1.",
        },
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
      label: { en: "Slug", ko: "슬러그" },
      admin: { position: "sidebar" },
    },
  ],
};
