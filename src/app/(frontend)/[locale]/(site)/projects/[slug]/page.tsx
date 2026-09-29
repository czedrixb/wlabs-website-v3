import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { PROJECTS, PROJECT_CATS, CATEGORY_SERVICE, CATEGORY_TOPIC, SERVICES } from "@/lib/site/content";
import { ProjectArt } from "@/components/site/work/ProjectArt";
import { siteMetadata } from "@/lib/site/metadata";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return PROJECTS.flatMap((p) => [
    { locale: "ko", slug: p.id },
    { locale: "en", slug: p.id },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const project = PROJECTS.find((p) => p.id === slug);
  if (!project) return {};
  return siteMetadata({
    locale,
    path: `/projects/${slug}`,
    title: locale === "en" ? project.title.en : project.title.ko,
    description: locale === "en" ? project.desc.en : project.desc.ko,
  });
}

// Every string below is a literal bilingual pair, not a dictionary key —
// v3's own `renderProjectPage()` (site/index.html:3317) string-templates
// `bi(en, ko)` at runtime rather than marking its markup up with `data-i`,
// so none of it went through the dictionary harvest. Transcribed verbatim,
// same convention as products/[slug]/page.tsx.
const T = {
  crumbWork: { en: "Work", ko: "하는 일" },
  crumbProjects: { en: "Projects", ko: "프로젝트" },
  discuss: { en: "Discuss a similar project", ko: "비슷한 프로젝트 문의" },
  allProjects: { en: "All projects", ko: "모든 프로젝트" },
  whatWeBuilt: { en: "What we built", ko: "무엇을 만들었나" },
  scopeOfWork: { en: "Scope of the work", ko: "작업 범위" },
  howWeWork: { en: "How we work", ko: "일하는 방식" },
  howWeWorkH2: {
    en: "Define the problem first, then choose the technology.",
    ko: "문제를 먼저 정의하고, 그다음 기술을 고릅니다.",
  },
  steps: [
    {
      title: { en: "Input", ko: "입력" },
      body: {
        en: "We read the data and the way the team actually works before proposing anything.",
        ko: "제안 전에 데이터와 팀의 실제 업무 방식을 먼저 읽습니다.",
      },
    },
    {
      title: { en: "Process", ko: "과정" },
      body: {
        en: "Design and build move together, with the client reviewing working software, not slides.",
        ko: "디자인과 개발이 함께 진행되며, 고객은 슬라이드가 아닌 동작하는 소프트웨어를 검토합니다.",
      },
    },
    {
      title: { en: "Output", ko: "결과" },
      body: {
        en: "A working service, documented and handed over with the team that built it still reachable.",
        ko: "문서화된 실제 서비스와, 만든 팀이 계속 연결되는 인수인계.",
      },
    },
  ],
  scopeNote: {
    en: "Outcomes and client names are shared only with the client's permission. Ask us and we will tell you what we can.",
    ko: "성과 수치와 고객사명은 고객의 허락이 있을 때만 공개합니다. 문의하시면 가능한 범위에서 안내드립니다.",
  },
  related: { en: "Related", ko: "관련" },
  relatedH2: { en: "Service behind it and nearby projects", ko: "관련 서비스와 프로젝트" },
  challenge: { en: "Have a similar challenge?", ko: "비슷한 과제가 있으신가요?" },
  challengeLead: {
    en: "Tell us what you want to change. We reply with questions, not a quote.",
    ko: "무엇을 바꾸고 싶은지 알려 주세요. 견적이 아닌 질문으로 답합니다.",
  },
  discussProject: { en: "Discuss your project", ko: "프로젝트 문의" },
  otherProjectsNav: { en: "Other projects", ko: "다른 프로젝트" },
  previous: { en: "Previous", ko: "이전" },
  next: { en: "Next", ko: "다음" },
};

// Each project's own 2-letter monogram for the "other projects in this
// category" rail (v3's `initials()`, site/index.html:3314) — computed the
// same way: first letters of up to the first two words of the English
// title, uppercased.
function initials(titleEn: string): string {
  const words = titleEn
    .replace(/[—-].*$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
}

export default async function ProjectPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const en = locale === "en";
  const i = PROJECTS.findIndex((p) => p.id === slug);
  if (i < 0) notFound();
  const project = PROJECTS[i];
  const cat = PROJECT_CATS.find((c) => c.id === project.cat)!;
  const svcId = CATEGORY_SERVICE[project.cat];
  const svc = SERVICES.find((s) => s.id === svcId)!;
  const prev = PROJECTS[(i + PROJECTS.length - 1) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const others = PROJECTS.filter((p) => p.cat === project.cat && p.id !== project.id);

  const t = (key: keyof typeof T) => (en ? (T[key] as { en: string }).en : (T[key] as { ko: string }).ko);

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="breadcrumb">
        <Link href={withLocale("/work", locale)}>{t("crumbWork")}</Link>
        <span>/</span>
        <Link href={withLocale("/work/cases", locale)}>{t("crumbProjects")}</Link>
        <span>/</span>
        <b>{en ? project.title.en : project.title.ko}</b>
      </nav>
      <header className="prod-head">
        <div style={{ display: "grid", gap: "var(--s2)" }}>
          <div className="tag">
            <span className="eyebrow">{en ? cat.label.en : cat.label.ko}</span>
            <span className="pcat">{en ? project.tag.en : project.tag.ko}</span>
          </div>
          <h1>{en ? project.title.en : project.title.ko}</h1>
          <p className="lead">{en ? project.desc.en : project.desc.ko}</p>
          <div className="cta">
            {/* data-contact preselects the sheet's topic per v3's CAT_TOPIC
                (index.html:3597); href is the no-JS fallback (WOS-336). */}
            <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={CATEGORY_TOPIC[project.cat]}>
              <span>{t("discuss")}</span>
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className="btn btn-ghost" href={withLocale("/work/cases", locale)}>
              {t("allProjects")}
            </Link>
          </div>
        </div>
        <ProjectArt art={project.art} />
      </header>

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("whatWeBuilt")}</span>
          <h2>{t("scopeOfWork")}</h2>
        </div>
        <div className="feats">
          {project.list.map((item, k) => (
            <article className="feat" key={k}>
              <span className="num">0{k + 1}</span>
              <h3>{en ? item.en : item.ko}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("howWeWork")}</span>
          <h2>{t("howWeWorkH2")}</h2>
        </div>
        <div className="steps">
          {T.steps.map((st, k) => (
            <div className="step" key={k}>
              <div>
                <h3>{en ? st.title.en : st.title.ko}</h3>
                <p>{en ? st.body.en : st.body.ko}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: "var(--s3)" }}>
          {t("scopeNote")}
        </p>
      </section>

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("related")}</span>
          <h2>{t("relatedH2")}</h2>
        </div>
        <div className="prod-rel">
          <Link className="rel-item" href={withLocale(`/work/services#${svc.anchor}`, locale)}>
            <span className="initial" aria-hidden="true">
              {svc.abbr}
            </span>
            <span>{en ? svc.name.en : svc.name.ko}</span>
          </Link>
          {others.map((p) => (
            <Link className="rel-item" href={withLocale(`/projects/${p.id}`, locale)} key={p.id}>
              <span className="initial" aria-hidden="true">
                {initials(p.title.en)}
              </span>
              <span>{en ? p.title.en : p.title.ko}</span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="prod-cta">
        <div>
          <h2>{t("challenge")}</h2>
          <p className="lead" style={{ marginTop: 8 }}>
            {t("challengeLead")}
          </p>
        </div>
        <div className="cta">
          <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={CATEGORY_TOPIC[project.cat]}>
            <span>{t("discussProject")}</span>
            <span className="arr" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </aside>

      <nav className="proj-nav" aria-label={t("otherProjectsNav")}>
        <Link href={withLocale(`/projects/${prev.id}`, locale)}>
          <span className="cap">{t("previous")}</span>
          <b>{en ? prev.title.en : prev.title.ko}</b>
        </Link>
        <Link className="nxt" href={withLocale(`/projects/${next.id}`, locale)}>
          <span className="cap">{t("next")}</span>
          <b>{en ? next.title.en : next.title.ko}</b>
        </Link>
      </nav>
    </div>
  );
}
