import type { CollectionConfig } from "payload";
import { TOPICS } from "@/lib/site/content";

// WOS-334: replaces v3's inquiry-form `localStorage` stub
// (site/index.html:3481-3501 — the prototype's own `demoNote` said as much)
// with a real, admin-readable record. Every submission is written once by
// src/app/api/contact/route.ts via the Local API (which runs with
// overrideAccess: true by default) — nothing here is meant to be created or
// edited through the admin UI or the public REST/GraphQL API, unlike the six
// WOS-333 content collections this otherwise sits beside.
//
// Unlike Posts.ts/Insights.ts, there is no KO/EN-tabs split: an inquiry is
// one submitted value per field, not authored content in two languages.
export const Inquiries: CollectionConfig = {
  slug: "inquiries",
  labels: {
    singular: { en: "Inquiry", ko: "문의" },
    plural: { en: "Inquiries", ko: "문의" },
  },
  defaultSort: "-createdAt",
  admin: {
    group: { en: "Inquiries", ko: "문의" },
    useAsTitle: "ref",
    defaultColumns: ["ref", "topic", "name", "email", "status", "createdAt"],
    listSearchableFields: ["ref", "name", "email", "org"],
    hideAPIURL: true,
    description: {
      ko: "웹사이트 문의 폼(연락처) 제출 내역입니다. 폼을 통해서만 생성되며, 어드민에서는 조회 전용입니다.",
      en: "Submissions from the site's contact form. Created only by the form itself — read-only here.",
    },
  },
  // PII lives in this collection, unlike the six WOS-333 content
  // collections (Team/Projects/Products/Services/Faq/Insights), which are
  // public marketing copy and so default to `read: () => true`. An
  // inquiry is neither public nor editable through the admin UI.
  access: {
    read: ({ req }) => Boolean(req.user),
    // The route handler creates via payload.create() (Local API,
    // overrideAccess: true by default) — this `false` only closes the
    // public REST/GraphQL create endpoint, it doesn't block the form.
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "ref",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: { en: "Reference", ko: "접수번호" },
      admin: { readOnly: true },
    },
    {
      name: "topic",
      type: "select",
      required: true,
      label: { en: "Topic", ko: "문의 주제" },
      // TOPICS (src/lib/site/content.ts, from v3's own TOPICS table) is
      // the single source of truth for this list — the form's <select>,
      // this field's options, and the route handler's server-side
      // validation all read the same array.
      options: TOPICS.map((t) => ({ label: { en: t.label.en, ko: t.label.ko }, value: t.id })),
      admin: { readOnly: true },
    },
    { name: "name", type: "text", required: true, label: { en: "Name", ko: "이름" }, admin: { readOnly: true } },
    { name: "org", type: "text", label: { en: "Company / organisation", ko: "회사 / 기관" }, admin: { readOnly: true } },
    { name: "email", type: "email", required: true, label: { en: "Email", ko: "이메일" }, admin: { readOnly: true } },
    { name: "phone", type: "text", label: { en: "Phone", ko: "연락처" }, admin: { readOnly: true } },
    { name: "message", type: "textarea", label: { en: "Message", ko: "내용" }, admin: { readOnly: true } },
    {
      name: "consentPrivacy",
      type: "checkbox",
      required: true,
      defaultValue: false,
      label: { en: "Privacy notice accepted", ko: "개인정보 수집·이용 동의" },
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "consentMarketing",
      type: "checkbox",
      defaultValue: false,
      label: { en: "Newsletter opt-in", ko: "뉴스레터 수신 동의" },
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "locale",
      type: "select",
      required: true,
      options: ["ko", "en"],
      label: { en: "Locale", ko: "언어" },
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "source",
      type: "text",
      required: true,
      defaultValue: "contact-form",
      label: { en: "Source", ko: "출처" },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: {
          ko: "제출된 폼의 종류입니다 (현재는 contact-form 뿐).",
          en: "Which form this came from (only contact-form exists today).",
        },
      },
    },
    {
      type: "collapsible",
      label: { en: "Spam signals", ko: "스팸 판별 정보" },
      admin: { initCollapsed: true },
      fields: [
        {
          name: "captchaStatus",
          type: "select",
          required: true,
          defaultValue: "skipped",
          label: { en: "reCAPTCHA status", ko: "reCAPTCHA 상태" },
          options: [
            { label: { en: "Verified", ko: "확인됨" }, value: "ok" },
            // No RECAPTCHA_SECRET configured — the normal state until keys
            // are provisioned (see the contact route handler).
            { label: { en: "Skipped (no key configured)", ko: "건너뜀 (키 미설정)" }, value: "skipped" },
            { label: { en: "Unavailable client-side", ko: "클라이언트에서 사용 불가" }, value: "unavailable" },
            { label: { en: "Verification error", ko: "확인 오류" }, value: "error" },
            { label: { en: "Score too low", ko: "점수 미달" }, value: "low-score" },
          ],
          admin: { readOnly: true },
        },
        {
          name: "captchaScore",
          type: "number",
          label: { en: "reCAPTCHA score", ko: "reCAPTCHA 점수" },
          admin: { readOnly: true },
        },
        { name: "userAgent", type: "text", label: { en: "User agent", ko: "User agent" }, admin: { readOnly: true } },
        { name: "ip", type: "text", label: { en: "IP", ko: "IP" }, admin: { readOnly: true } },
      ],
    },
    // The one writable field: lets a responder track handling without
    // reaching into the DB directly. Slightly beyond the ticket's literal
    // "readable in Payload admin" — drop this field if the collection
    // should stay strictly read-only.
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      label: { en: "Status", ko: "처리 상태" },
      options: [
        { label: { en: "New", ko: "신규" }, value: "new" },
        { label: { en: "Replied", ko: "답변 완료" }, value: "replied" },
        { label: { en: "Archived", ko: "보관" }, value: "archived" },
      ],
      admin: { position: "sidebar" },
    },
  ],
};
