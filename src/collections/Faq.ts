import type { CollectionConfig } from "payload";

// WOS-333: structural site content, not articles — no drafts/versions.
// Follows Posts.ts's unnamed KO/EN-tabs split.
export const Faq: CollectionConfig = {
  slug: "faq",
  labels: {
    singular: { en: "FAQ", ko: "자주 묻는 질문" },
    plural: { en: "FAQ", ko: "자주 묻는 질문" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "question",
    defaultColumns: ["question", "order"],
    listSearchableFields: ["question", "questionEn"],
    hideAPIURL: true,
    description: {
      ko: "홈 화면 FAQ 모듈에 표시되는 질문·답변입니다.",
      en: "Question/answer pairs shown in Home's FAQ module.",
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
            { name: "question", type: "text", required: true, label: { en: "Question (Korean)", ko: "질문" } },
            { name: "answer", type: "textarea", required: true, label: { en: "Answer (Korean)", ko: "답변" } },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            {
              name: "questionEn",
              type: "text",
              label: { en: "Question (English)", ko: "질문 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 질문이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean question is shown instead.",
                },
              },
            },
            {
              name: "answerEn",
              type: "textarea",
              label: { en: "Answer (English)", ko: "답변 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 답변이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean answer is shown instead.",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      label: { en: "Order", ko: "정렬 순서" },
      admin: {
        position: "sidebar",
        description: {
          ko: "홈 화면은 이 순서의 앞 4개만 보여줍니다.",
          en: "Home shows only the first 4 in this order.",
        },
      },
    },
  ],
};
