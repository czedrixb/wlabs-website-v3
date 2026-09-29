import type { CollectionConfig } from "payload";

// WOS-333: structural site content, not articles — no drafts/versions.
// Bilingual scalars follow Posts.ts's unnamed KO/EN-tabs split; the
// repeatable `bullets` list can't fit that split (a bullet has no natural
// "Korean half" vs "English half" screen) so it's one array outside the
// tabs with both languages side by side per row — rows can never drift out
// of index alignment the way two parallel arrays could.
export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: { en: "Project", ko: "프로젝트" },
    plural: { en: "Projects", ko: "프로젝트" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "title",
    defaultColumns: ["title", "cat", "order"],
    listSearchableFields: ["title", "titleEn", "slug"],
    hideAPIURL: true,
    description: {
      ko: "Work → 프로젝트 목록과 상세 페이지에 표시되는 프로젝트입니다.",
      en: "Projects shown on the Work list and project detail pages.",
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
            {
              name: "tag",
              type: "text",
              label: { en: "Tag (Korean)", ko: "태그" },
              admin: {
                description: { ko: "카드 상단의 짧은 분류 태그.", en: "Short category tag shown above the title." },
              },
            },
            {
              name: "title",
              type: "text",
              required: true,
              label: { en: "Title (Korean)", ko: "제목" },
            },
            {
              name: "desc",
              type: "textarea",
              label: { en: "Description (Korean)", ko: "설명" },
            },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            {
              name: "tagEn",
              type: "text",
              label: { en: "Tag (English)", ko: "태그 (영문)" },
            },
            {
              name: "titleEn",
              type: "text",
              label: { en: "Title (English)", ko: "제목 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 제목이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean title is shown instead.",
                },
              },
            },
            {
              name: "descEn",
              type: "textarea",
              label: { en: "Description (English)", ko: "설명 (영문)" },
            },
          ],
        },
      ],
    },
    {
      name: "bullets",
      type: "array",
      label: { en: "Bullets", ko: "요약 목록" },
      admin: {
        description: {
          ko: "프로젝트 상세 화면의 요약 목록입니다. 각 줄마다 한국어/영문을 함께 입력하세요.",
          en: "The detail page's summary list. Enter Korean and English side by side on each row.",
        },
      },
      fields: [
        { name: "item", type: "text", required: true, label: { en: "Item (Korean)", ko: "항목" } },
        { name: "itemEn", type: "text", label: { en: "Item (English)", ko: "항목 (영문)" } },
      ],
    },
    {
      name: "cat",
      type: "select",
      required: true,
      label: { en: "Category", ko: "분류" },
      options: [
        { label: { en: "Health", ko: "헬스케어" }, value: "health" },
        { label: { en: "Education", ko: "교육" }, value: "edu" },
        { label: { en: "Language", ko: "언어" }, value: "lang" },
        { label: { en: "Productivity", ko: "생산성" }, value: "prod" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "art",
      type: "select",
      required: true,
      label: { en: "Art key", ko: "아트 키" },
      defaultValue: "grid",
      options: [
        "cells",
        "plate",
        "grid",
        "bubbles",
        "translate",
        "card",
        "checklist",
        "wave",
        "layers",
      ].map((v) => ({ label: v, value: v })),
      admin: {
        position: "sidebar",
        description: {
          ko: "ProjectArt.tsx의 프레젠테이션 키입니다 — 수동 매핑이므로 이유를 알 때만 변경하세요.",
          en: "ProjectArt.tsx's presentation key — a hand-mapped constant, edit only if you know why.",
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
      label: { en: "Slug (URL)", ko: "슬러그 (URL)" },
      admin: {
        position: "sidebar",
        description: {
          ko: "프로젝트 상세 페이지의 URL입니다.",
          en: "The project detail page's URL.",
        },
      },
    },
  ],
};
