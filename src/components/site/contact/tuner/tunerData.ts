import type { SiteStrings } from "@/lib/site/dictionary";

// WOS-336: the sp-tuner's data tables — v3's MOD:tuner constants
// (site/index.html:4896-4968), transcribed verbatim. The RESONANCE map is
// "the single object the sales team can tune": each set dial adds its
// `scores` to the five services (highest total wins, ties → lower number);
// the product follows the `building` option plus optional `also`, with
// `productOverrides` checked in order (first hit wins); the first step is
// firstStep[stage][pace]; `projects` lists which named projects light up
// per service.

export type AxisId = "building" | "stage" | "pace";
export type OptionId =
  | "ai"
  | "software"
  | "imaging"
  | "interface"
  | "modernise"
  | "idea"
  | "spec"
  | "prototype"
  | "production"
  | "exploring"
  | "quarter"
  | "urgent";
export type StepId = "define" | "workshop" | "prototype" | "build" | "review" | "migration";
export type TunerProductId = "skinarch" | "wiz" | "brainarch" | "custom";
export type TunerState = Record<AxisId, OptionId | null>;

type TunerStrings = SiteStrings["tuner"];
// Only the flat string fields of the tuner namespace (its option/step
// records are excluded) — lets the card descriptors below reference
// dictionary fields by name, typechecked.
export type TunerStringField = { [K in keyof TunerStrings]: TunerStrings[K] extends string ? K : never }[keyof TunerStrings];

export const SP_TUNER_AXES: { id: AxisId; qField: TunerStringField; options: OptionId[]; def: number }[] = [
  { id: "building", qField: "q1", options: ["ai", "software", "imaging", "interface", "modernise"], def: 2 },
  { id: "stage", qField: "q2", options: ["idea", "spec", "prototype", "production"], def: 1 },
  { id: "pace", qField: "q3", options: ["exploring", "quarter", "urgent"], def: 1 },
];

type BuildingRule = { scores: Record<number, number>; product: TunerProductId; also?: TunerProductId };

export const SP_TUNER_RESONANCE: {
  building: Record<string, BuildingRule>;
  stage: Record<string, { scores: Record<number, number> }>;
  pace: Record<string, { scores: Record<number, number> }>;
  productOverrides: { when: Partial<Record<AxisId, OptionId>>; product: TunerProductId; also?: TunerProductId }[];
  firstStep: Record<string, Record<string, StepId>>;
  projects: Record<number, string[]>;
} = {
  building: {
    ai: { scores: { 1: 5, 2: 1, 3: 1, 4: 0, 5: 0 }, product: "wiz" },
    software: { scores: { 1: 1, 2: 5, 3: 0, 4: 1, 5: 1 }, product: "custom" },
    imaging: { scores: { 1: 1, 2: 0, 3: 5, 4: 0, 5: 0 }, product: "skinarch", also: "brainarch" },
    interface: { scores: { 1: 0, 2: 1, 3: 0, 4: 5, 5: 0 }, product: "custom", also: "wiz" },
    modernise: { scores: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 5 }, product: "custom" },
  },
  stage: {
    idea: { scores: { 4: 1 } }, // an idea benefits from design thinking
    spec: { scores: { 2: 1 } },
    prototype: { scores: { 2: 1 } },
    production: { scores: { 5: 2 } }, // live systems pull toward Evolution
  },
  pace: {
    exploring: { scores: {} },
    quarter: { scores: {} },
    urgent: { scores: { 1: 1 } }, // urgent work often starts as an automation slice
  },
  productOverrides: [
    { when: { building: "ai", stage: "production" }, product: "wiz" },
    { when: { building: "interface", stage: "production" }, product: "wiz", also: "custom" },
  ],
  firstStep: {
    idea: { exploring: "define", quarter: "define", urgent: "workshop" },
    spec: { exploring: "define", quarter: "prototype", urgent: "prototype" },
    prototype: { exploring: "prototype", quarter: "build", urgent: "build" },
    production: { exploring: "review", quarter: "migration", urgent: "migration" },
  },
  projects: {
    1: ["yumtrack", "kindleup", "audiomint"],
    2: ["uedu", "lingrid", "todont"],
    3: ["skinoptics"],
    4: ["pagoda"],
    5: [],
  },
};

// Service / product metadata the readout needs; `topic` is the contact
// TOPICS slug the payload hands the form (v3 :4947-4959).
export const SP_TUNER_SERVICES: { id: number; code: string; nameField: TunerStringField; topic: string }[] = [
  { id: 1, code: "INTELLIGENCE", nameField: "svcNm1", topic: "ai" },
  { id: 2, code: "CREATION", nameField: "svcNm2", topic: "custom" },
  { id: 3, code: "INSIGHT", nameField: "svcNm3", topic: "data" },
  { id: 4, code: "EXPERIENCE", nameField: "svcNm4", topic: "design" },
  { id: 5, code: "EVOLUTION", nameField: "svcNm5", topic: "support" },
];

export const SP_TUNER_PRODUCTS: { id: TunerProductId; nameField: TunerStringField; ruo?: boolean; isCustom?: boolean }[] = [
  { id: "skinarch", nameField: "nmSkin", ruo: true },
  { id: "wiz", nameField: "nmWiz" },
  { id: "brainarch", nameField: "nmBrain", ruo: true },
  { id: "custom", nameField: "customBuild", isCustom: true },
];

// The three card grids as data, natural (markup) order — v3 renders these
// as static markup (index.html:2822-2963) and captures the order before
// any FLIP; here the same descriptors drive both the JSX and the reset
// order.
export type SvcCard = {
  id: number;
  number: string;
  codeField: TunerStringField;
  nameField: TunerStringField;
  descField: TunerStringField;
  chips: { term: string; labelField: TunerStringField }[];
  relatedField: TunerStringField;
  related: { abbr: string; nameField: TunerStringField }[];
  noteField?: TunerStringField;
};

export const SVC_CARDS: SvcCard[] = [
  {
    id: 1,
    number: "01",
    codeField: "svcCode1",
    nameField: "svcNm1",
    descField: "svc1",
    chips: [
      { term: "Computer vision", labelField: "tagCv" },
      { term: "NLP / LLM", labelField: "tagNlp" },
      { term: "Workflow AI", labelField: "tagWf" },
    ],
    relatedField: "related",
    related: [
      { abbr: "Y", nameField: "nmYum" },
      { abbr: "K", nameField: "nmKindle" },
      { abbr: "A", nameField: "nmAudio" },
    ],
  },
  {
    id: 2,
    number: "02",
    codeField: "svcCode2",
    nameField: "svcNm2",
    descField: "svc2",
    chips: [
      { term: "Web platforms", labelField: "tagWeb" },
      { term: "SaaS", labelField: "tagSaas" },
      { term: "Full-stack", labelField: "tagFull" },
    ],
    relatedField: "related",
    related: [
      { abbr: "UE", nameField: "nmUedu" },
      { abbr: "L", nameField: "nmLingrid" },
      { abbr: "T", nameField: "nmTodont" },
    ],
  },
  {
    id: 3,
    number: "03",
    codeField: "svcCode3",
    nameField: "svcNm3",
    descField: "svc3",
    chips: [
      { term: "LC-OCT", labelField: "tagLcoct" },
      { term: "Segmentation", labelField: "tagSeg" },
      { term: "3D reconstruction", labelField: "tag3d" },
    ],
    relatedField: "relatedProducts",
    related: [
      { abbr: "S", nameField: "nmSkin" },
      { abbr: "B", nameField: "nmBrain" },
      { abbr: "SO", nameField: "nmOptics" },
    ],
  },
  {
    id: 4,
    number: "04",
    codeField: "svcCode4",
    nameField: "svcNm4",
    descField: "svc4",
    chips: [
      { term: "Interface design", labelField: "tagIf" },
      { term: "Prototyping", labelField: "tagProto" },
      { term: "Design systems", labelField: "tagDs" },
    ],
    relatedField: "related",
    related: [
      { abbr: "PT", nameField: "nmPagoda" },
      { abbr: "WA", nameField: "nmWiz" },
    ],
  },
  {
    id: 5,
    number: "05",
    codeField: "svcCode5",
    nameField: "svcNm5",
    descField: "svc5",
    chips: [
      { term: "Legacy migration", labelField: "tagLegacy" },
      { term: "Integration", labelField: "tagIntg" },
      { term: "Maintenance", labelField: "tagMaint" },
    ],
    relatedField: "related",
    related: [
      { abbr: "LD", nameField: "nmDispatch" },
      { abbr: "PP", nameField: "nmPrint" },
    ],
    noteField: "relatedOpsNote",
  },
];

export type ProdCard = {
  id: TunerProductId;
  kindField: TunerStringField;
  nameField: TunerStringField;
  descField: TunerStringField;
  priceField: TunerStringField;
  ruo?: boolean;
  isCustom?: boolean;
};

export const PROD_CARDS: ProdCard[] = [
  { id: "skinarch", kindField: "kindImaging", nameField: "nmSkin", descField: "p1", priceField: "priceAsk", ruo: true },
  { id: "wiz", kindField: "kindConv", nameField: "nmWiz", descField: "p2", priceField: "monthly" },
  { id: "brainarch", kindField: "kindImaging", nameField: "nmBrain", descField: "p3", priceField: "priceAsk", ruo: true },
  // v3's fourth card reuses the Creation service's body copy (data-i
  // "spTunerSvc2" on the custom card, index.html:2942).
  { id: "custom", kindField: "customTag", nameField: "customBuild", descField: "svc2", priceField: "priceAsk", isCustom: true },
];

export type ProjCard = { id: string; catField: TunerStringField; nameField: TunerStringField; descField: TunerStringField };

export const PROJ_CARDS: ProjCard[] = [
  { id: "yumtrack", catField: "cat1", nameField: "nmYum", descField: "pr1" },
  { id: "skinoptics", catField: "cat1", nameField: "nmOptics", descField: "pr2" },
  { id: "uedu", catField: "cat2", nameField: "nmUedu", descField: "pr3" },
  { id: "pagoda", catField: "cat2", nameField: "nmPagoda", descField: "pr4" },
  { id: "lingrid", catField: "cat3", nameField: "nmLingrid", descField: "pr5" },
  { id: "kindleup", catField: "cat3", nameField: "nmKindle", descField: "pr6" },
  { id: "todont", catField: "cat4", nameField: "nmTodont", descField: "pr7" },
  { id: "audiomint", catField: "cat4", nameField: "nmAudio", descField: "pr8" },
];

export type TunerPayload = {
  topic: string;
  service: string | null;
  timeline: OptionId | null;
  scope: OptionId | null;
  stage: OptionId | null;
  locked: boolean;
  summary: string;
};

export type TunerResolution = {
  service: number | null;
  product: TunerProductId | null;
  also: TunerProductId | null;
  step: StepId | null;
  projects: string[];
  locked: boolean;
  partial: boolean;
};

// v3's resolve() (index.html:5040-5055), verbatim semantics: nothing set →
// all null; no `building` → no service/product/projects even when stage/
// pace score; ties break toward the lower service id.
export function resolveTuner(state: TunerState): TunerResolution {
  const set = Object.values(state).some(Boolean);
  if (!set) return { service: null, product: null, also: null, step: null, projects: [], locked: false, partial: false };
  const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const ax of SP_TUNER_AXES) {
    const o = state[ax.id];
    if (!o) continue;
    const sc = SP_TUNER_RESONANCE[ax.id][o]?.scores ?? {};
    for (const k in sc) totals[Number(k)] += sc[Number(k)];
  }
  let service: number | null = null;
  if (state.building) {
    service = 1;
    for (let k = 1; k <= 5; k++) if (totals[k] > totals[service]) service = k;
  }
  let product: TunerProductId | null = null;
  let also: TunerProductId | null = null;
  if (state.building) {
    const b = SP_TUNER_RESONANCE.building[state.building];
    product = b.product;
    also = b.also ?? null;
    for (const rule of SP_TUNER_RESONANCE.productOverrides) {
      if (Object.entries(rule.when).every(([k, v]) => state[k as AxisId] === v)) {
        product = rule.product;
        also = rule.also ?? also;
        break;
      }
    }
  }
  const step = state.stage && state.pace ? SP_TUNER_RESONANCE.firstStep[state.stage][state.pace] : null;
  return {
    service,
    product,
    also,
    step,
    projects: service ? SP_TUNER_RESONANCE.projects[service] : [],
    locked: Boolean(state.building && state.stage && state.pace),
    partial: !state.building,
  };
}
