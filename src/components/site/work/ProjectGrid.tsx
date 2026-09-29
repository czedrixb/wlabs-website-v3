"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { Project, ProjectCat } from "@/lib/site/content";
import { useTrackPill } from "@/components/site/chrome/lib/trackPill";
import { ProjectArt } from "./ProjectArt";

// Shared by Home's project strip (`limit`, no status line) and Work →
// Projects (`/work/cases`, unlimited, with the live count). Ported from
// site/index.html's one `renderProjects(scope)` serving both `data-
// projects="home"`/`"all"` scopes — filtering is client-side exactly as in
// the source (the full PROJECTS table always ships; only the rendered
// slice changes).
//
// v3's cards close a modal sheet (`data-pdetail`, `openDetail()`); that's a
// hash-router artifact of a single-page prototype. Here each card links to
// its own /projects/[id] route (WOS-332 plan's M4) instead — there is a
// real page to land on, so there is no reason to fake one with a sheet.

// Neither string is a v3 dictionary key (`data-i`) — both are literal
// bilingual text baked straight into `renderProjects()`'s own template, so
// they're literals here too rather than harvested keys (same convention as
// dictionary.ts's STORY_ARIA_LABEL).
const PROJECT_PAGE_LABEL = { en: "Project page", ko: "프로젝트 페이지" };
const CTA_CARD = {
  eyebrow: { en: "Your project", ko: "당신의 프로젝트" },
  title: { en: "The next project is your story.", ko: "다음 프로젝트는 당신의 이야기로." },
  body: {
    en: "Tell us about a new service, a task you want to change, or a problem you want to solve.",
    ko: "새로운 서비스, 바꾸고 싶은 업무, 풀고 싶은 문제를 들려주세요.",
  },
  cta: { en: "Share your idea", ko: "아이디어 이야기하기" },
};
const STATUS_SUFFIX = { en: " projects", ko: "개 프로젝트" };

type Props = {
  locale: Locale;
  cats: ProjectCat[];
  projects: Project[];
  filterLabel: string;
  limit?: number;
  /** Home's strip skips the live `[role=status]` count line; /work/cases shows it. */
  showStatus?: boolean;
};

export function ProjectGrid({ locale, cats, projects, filterLabel, limit, showStatus }: Props) {
  const [active, setActive] = useState<ProjectCat["id"]>("all");
  const trackRef = useRef<HTMLDivElement>(null);
  useTrackPill(trackRef, active);

  const filtered = active === "all" ? projects : projects.filter((p) => p.cat === active);
  const items = limit ? filtered.slice(0, limit) : filtered;
  const count = filtered.length;

  return (
    <>
      <div className="filters" role="group" aria-label={filterLabel}>
        <div className="filters-track" ref={trackRef}>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={active === c.id}
              onClick={() => setActive(c.id)}
            >
              {locale === "en" ? c.label.en : c.label.ko}
            </button>
          ))}
        </div>
      </div>
      {showStatus && (
        <p className="vh" role="status">
          {count}
          {locale === "en" ? STATUS_SUFFIX.en : STATUS_SUFFIX.ko}
        </p>
      )}
      <div className="pgrid">
        {items.map((p) => (
          <article className="pcard" key={p.id}>
            <ProjectArt art={p.art} />
            <div className="pbody">
              <span className="pcat">{locale === "en" ? p.tag.en : p.tag.ko}</span>
              <h3>{locale === "en" ? p.title.en : p.title.ko}</h3>
              <p>{locale === "en" ? p.desc.en : p.desc.ko}</p>
              <Link className="pfoot" href={withLocale(`/projects/${p.id}`, locale)}>
                <span>{locale === "en" ? PROJECT_PAGE_LABEL.en : PROJECT_PAGE_LABEL.ko}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
        <div className="pcta">
          <div className="pcta-vis" aria-hidden="true">
            <span className="plus">+</span>
          </div>
          <div className="pbody">
            <span className="pcat">{locale === "en" ? CTA_CARD.eyebrow.en : CTA_CARD.eyebrow.ko}</span>
            <h3>{locale === "en" ? CTA_CARD.title.en : CTA_CARD.title.ko}</h3>
            <p>{locale === "en" ? CTA_CARD.body.en : CTA_CARD.body.ko}</p>
            <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact="general">
              <span>{locale === "en" ? CTA_CARD.cta.en : CTA_CARD.cta.ko}</span>
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
