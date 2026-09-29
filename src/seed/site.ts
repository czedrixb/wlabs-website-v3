/**
 * Idempotent seed for WOS-333's six site-content collections, sourced from
 * the typed constants at src/lib/site/content.ts (which WOS-332 built
 * specifically for this). Same shape as upsertPost/upsertUser in
 * src/seed/index.ts: find by a unique key, skip if present, create, log.
 * Safe to re-run.
 */
import type { Payload } from "payload";
import {
  TEAM,
  PROJECTS,
  PRODUCTS,
  PRODUCT_ORDER,
  SERVICES,
  FAQ,
  INSIGHTS,
  type ProductRel,
  type ServiceRelatedRef,
} from "@/lib/site/content";
import { V3_STRINGS } from "@/lib/site/dictionary.generated";
import { slugify } from "@/lib/slugify";
import type { Team, Project, Product, Service, Faq, Insight } from "@/payload-types";

type NewData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

async function upsertTeamMember(payload: Payload, slug: string, build: () => NewData<Team>) {
  const existing = await payload.find({ collection: "team", where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): team/${slug}`);
  await payload.create({ collection: "team", data: build() });
  console.log(`created: team/${slug}`);
}

async function upsertProject(payload: Payload, slug: string, build: () => NewData<Project>) {
  const existing = await payload.find({ collection: "projects", where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): projects/${slug}`);
  await payload.create({ collection: "projects", data: build() });
  console.log(`created: projects/${slug}`);
}

async function upsertProduct(payload: Payload, slug: string, build: () => NewData<Product>) {
  const existing = await payload.find({ collection: "products", where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): products/${slug}`);
  await payload.create({ collection: "products", data: build() });
  console.log(`created: products/${slug}`);
}

async function upsertService(payload: Payload, slug: string, build: () => NewData<Service>) {
  const existing = await payload.find({ collection: "services", where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): services/${slug}`);
  await payload.create({ collection: "services", data: build() });
  console.log(`created: services/${slug}`);
}

// Faq has no slug (a question has no natural URL) — dedupe on the Korean
// question text instead, the same role `slug` plays elsewhere.
async function upsertFaqItem(payload: Payload, question: string, build: () => NewData<Faq>) {
  const existing = await payload.find({ collection: "faq", where: { question: { equals: question } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): faq/${question}`);
  await payload.create({ collection: "faq", data: build() });
  console.log(`created: faq/${question}`);
}

async function upsertInsight(payload: Payload, slug: string, build: () => NewData<Insight>) {
  const existing = await payload.find({ collection: "insights", where: { slug: { equals: slug } }, limit: 1 });
  if (existing.docs[0]) return console.log(`skip (exists): insights/${slug}`);
  await payload.create({ collection: "insights", data: build() });
  console.log(`created: insights/${slug}`);
}

function toProductRelRow(r: ProductRel): NonNullable<Product["rel"]>[number] {
  if (r.kind === "project") {
    return { kind: "project", refId: r.id, abbr: r.abbr, label: r.label };
  }
  return { kind: "service", abbr: r.abbr, label: r.label.ko, labelEn: r.label.en };
}

function toServiceRelatedRow(r: ServiceRelatedRef): NonNullable<Service["related"]>[number] {
  if (r.kind === "static") {
    return { kind: "static", abbr: r.abbr, label: r.label.ko, labelEn: r.label.en };
  }
  return { kind: r.kind, refId: r.id, abbr: r.abbr };
}

export async function seedSiteContent(payload: Payload): Promise<void> {
  // ── Team (23) ───────────────────────────────────────────────────────────
  for (const [index, m] of TEAM.entries()) {
    const slug = slugify(m.name);
    await upsertTeamMember(payload, slug, () => ({
      name: m.name,
      nameKo: m.nameKo,
      role: m.role.ko,
      roleEn: m.role.en,
      group: m.group,
      photo: m.photo,
      order: index,
      slug,
    }));
  }

  // ── Projects (8) ────────────────────────────────────────────────────────
  for (const [index, p] of PROJECTS.entries()) {
    await upsertProject(payload, p.id, () => ({
      tag: p.tag.ko,
      tagEn: p.tag.en,
      title: p.title.ko,
      titleEn: p.title.en,
      desc: p.desc.ko,
      descEn: p.desc.en,
      bullets: p.list.map((b) => ({ item: b.ko, itemEn: b.en })),
      cat: p.cat,
      art: p.art,
      order: index,
      slug: p.id,
    }));
  }

  // ── Products (3) — PRODUCT_ORDER carries display order ──────────────────
  for (const [index, id] of PRODUCT_ORDER.entries()) {
    const p = PRODUCTS[id];
    await upsertProduct(payload, p.id, () => ({
      name: p.name,
      cat: p.cat.ko,
      catEn: p.cat.en,
      lead: p.lead.ko,
      leadEn: p.lead.en,
      whoH: p.whoH.ko,
      whoHEn: p.whoH.en,
      who: p.who.ko,
      whoEn: p.who.en,
      note: p.note?.ko,
      noteEn: p.note?.en,
      feats: p.feats.map((f) => ({ title: f.title.ko, titleEn: f.title.en, body: f.body.ko, bodyEn: f.body.en })),
      steps: p.steps.map((s) => ({ title: s.title.ko, titleEn: s.title.en, body: s.body.ko, bodyEn: s.body.en })),
      facts: p.facts.map((f) => ({ label: f.label.ko, labelEn: f.label.en, body: f.body.ko, bodyEn: f.body.en })),
      rel: p.rel.map(toProductRelRow),
      teaserChips: p.teaserChips.map((chip) => ({ chip })),
      ruo: p.ruo,
      priceKey: p.priceKey,
      topic: p.topic,
      order: index,
      slug: p.id,
    }));
  }

  // ── Services (5) — body/blurb aren't in SERVICES; join by index against
  // the dictionary's work.d1..d5 / band.svc1..5 (see content.ts's header and
  // Services.ts's collection comment for why).
  for (const [index, svc] of SERVICES.entries()) {
    const n = index + 1;
    const bodyKo = V3_STRINGS.ko.work[`d${n}` as keyof typeof V3_STRINGS.ko.work];
    const bodyEn = V3_STRINGS.en.work[`d${n}` as keyof typeof V3_STRINGS.en.work];
    const blurbKo = V3_STRINGS.ko.band[`svc${n}` as keyof typeof V3_STRINGS.ko.band];
    const blurbEn = V3_STRINGS.en.band[`svc${n}` as keyof typeof V3_STRINGS.en.band];
    await upsertService(payload, svc.id, () => ({
      name: svc.name.ko,
      nameEn: svc.name.en,
      body: bodyKo,
      bodyEn,
      blurb: blurbKo,
      blurbEn,
      related: svc.related.map(toServiceRelatedRow),
      chips: svc.chips.map((chip) => ({ chip })),
      relatedCaption: svc.relatedCaption,
      number: svc.number,
      code: svc.code,
      abbr: svc.abbr,
      anchor: svc.anchor,
      weight: svc.weight,
      order: index,
      slug: svc.id,
    }));
  }

  // ── FAQ (8) ───────────────────────────────────────────────────────────
  for (const [index, item] of FAQ.entries()) {
    await upsertFaqItem(payload, item.q.ko, () => ({
      question: item.q.ko,
      questionEn: item.q.en,
      answer: item.a.ko,
      answerEn: item.a.en,
      order: index,
    }));
  }

  // ── Insights (5) ──────────────────────────────────────────────────────
  for (const [index, item] of INSIGHTS.entries()) {
    await upsertInsight(payload, item.id, () => ({
      heading: item.heading.ko,
      headingEn: item.heading.en,
      body: item.body.ko,
      bodyEn: item.body.en,
      kind: item.kind,
      date: item.date,
      link: item.link,
      order: index,
      slug: item.id,
    }));
  }

  console.log("Site content seed complete.");
}
