import type { CollectionConfig } from "payload";
import { slugify } from "@/lib/slugify";

// WOS-333: structural site content, not articles — no drafts/versions (see
// Posts.ts for that pattern instead). Bilingual fields follow the same
// unnamed KO/EN-tabs split as Posts (not Payload's locale switcher — see
// payload.config.ts's i18n comment for why). `name` is the Latin identity
// (always present, unique) and lives outside the tabs; `nameKo` is optional
// per-member and lives in the Korean tab alongside `role`.
export const Team: CollectionConfig = {
  slug: "team",
  labels: {
    singular: { en: "Team Member", ko: "팀원" },
    plural: { en: "Team", ko: "팀" },
  },
  defaultSort: "order",
  admin: {
    group: { en: "Site content", ko: "사이트 콘텐츠" },
    useAsTitle: "name",
    defaultColumns: ["name", "group", "order"],
    listSearchableFields: ["name", "nameKo", "slug"],
    hideAPIURL: true,
    description: {
      ko: "회사 소개 → 팀 패널에 표시되는 팀원 목록입니다.",
      en: "The roster shown on the Company → Team panel.",
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
          ko: "라틴 문자 이름입니다 (예: Matt). 이 값이 화면에 표시되는 주 이름입니다.",
          en: "The Latin-script name (e.g. Matt) — this is the primary displayed name.",
        },
      },
    },
    {
      // Unnamed tabs, same reasoning as Posts.ts: every field stays
      // top-level so useAsTitle/defaultColumns/listSearchableFields above
      // keep working.
      type: "tabs",
      tabs: [
        {
          label: { en: "Korean", ko: "한국어" },
          fields: [
            {
              name: "nameKo",
              type: "text",
              label: { en: "Name (Korean)", ko: "한글 이름" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 일부 팀원은 한글 이름이 없습니다.",
                  en: "Optional — some members have no Korean name on file.",
                },
              },
            },
            {
              name: "role",
              type: "text",
              required: true,
              label: { en: "Role (Korean)", ko: "직책" },
            },
          ],
        },
        {
          label: { en: "English", ko: "English" },
          fields: [
            {
              name: "roleEn",
              type: "text",
              label: { en: "Role (English)", ko: "직책 (영문)" },
              admin: {
                description: {
                  ko: "선택 사항입니다. 비워두면 한국어 직책이 대신 표시됩니다.",
                  en: "Optional. If left blank, the Korean role is shown instead.",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "group",
      type: "select",
      required: true,
      label: { en: "Group", ko: "그룹" },
      defaultValue: "dev",
      options: [
        { label: { en: "Management", ko: "경영·관리" }, value: "mgmt" },
        { label: { en: "Development", ko: "개발" }, value: "dev" },
        { label: { en: "Design", ko: "디자인" }, value: "design" },
        { label: { en: "QA", ko: "QA" }, value: "qa" },
        { label: { en: "Business", ko: "비즈니스" }, value: "biz" },
        { label: { en: "Role to be confirmed", ko: "직책 미정" }, value: "tbc" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "photo",
      type: "text",
      label: { en: "Photo path", ko: "사진 경로" },
      admin: {
        position: "sidebar",
        description: {
          ko: "예: /site/team/Matt.webp — 사진이 없으면 비워두세요.",
          en: "e.g. /site/team/Matt.webp — leave blank if there is no photo.",
        },
      },
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
          ko: "홈 화면의 6인 티저는 이 순서의 앞 6명을 보여줍니다.",
          en: "Home's six-face teaser shows the first 6 in this order.",
        },
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { en: "Slug", ko: "슬러그" },
      admin: {
        position: "sidebar",
        description: {
          ko: "이름에서 자동 생성됩니다. 이유를 알 때만 수정하세요.",
          en: "Auto-generated from the name. Edit only if you know why.",
        },
      },
      hooks: {
        beforeValidate: [
          ({ value, data, originalDoc }) => {
            if (value) return value;
            const source = data?.name ?? originalDoc?.name;
            if (!source) return value;
            return slugify(typeof source === "string" ? source : String(source));
          },
        ],
      },
    },
  ],
};
