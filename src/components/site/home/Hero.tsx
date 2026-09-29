"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { HeroMark } from "./HeroMark";

// The scroll-driven hero: a sticky stage inside a tall .story, cross-fading
// three chapters (Input → Process → Output) while a layered isometric deck
// (.dp-stack) fans open beneath the mark. Ported from site/index.html's two
// separate scripts — the chapter/mark/timeline "scroll story" and the deck
// sync that reads which chapter is reading — unified here into one effect,
// since React gives both a single source of truth (`progress`) instead of
// the original's two independent re-derivations of roughly the same value.
//
// Every scroll-driven value below is written straight to the DOM via refs,
// not React state — this runs on every scroll tick, well above the budget
// a state update (and the render it triggers) is worth paying on each one.
//
// Not ported: node-tips, the floating snippet callouts that ride the wave
// paths (HeroMark.tsx has the doc on why), and the pointer-parallax that
// existed only to serve them.

const CHAPTERS = [
  {
    eyebrow: "01 / INPUT — 가능성의 시작",
    heading: (
      <h1>
        복잡한 문제를,
        <br />
        <span className="accent">작동하는 소프트웨어</span>로.
      </h1>
    ),
    lead: "AI와 소프트웨어로 비즈니스의 다음 단계를 함께 설계하고 만듭니다. 성장과 디지털 전환의 파트너, W Labs.",
  },
  {
    eyebrow: "02 / PROCESS — 연결되는 맥락",
    heading: (
      <h2>
        문제를 먼저 정의하고,
        <br />
        <span className="accent">그다음 기술</span>을 고릅니다.
      </h2>
    ),
    lead: "데이터를 읽고, 맥락을 연결하고, 그 문제에 정말 필요한 AI와 소프트웨어를 설계합니다.",
  },
  {
    eyebrow: "03 / OUTPUT — 현실이 되는 기술",
    heading: (
      <h2>
        가능성이 아닌,
        <br />
        <span className="accent">작동하는 서비스</span>.
      </h2>
    ),
    lead: "분석에서 안내까지, 영상에서 번역까지. 기술의 마지막 목적지는 누군가의 업무 현장입니다.",
  },
];

const SCENES = ["입력", "이해", "실현"];

// Layer 0 = data floor, 1 = intelligence, 2 = experience, 3 = platform
// (never lifted — it's what everything else lands on). --i/--z are the
// deck's own static stacking tokens; --lz is the one this component drives.
const LAYERS = [
  { key: "data", i: 0, z: 1, className: "dp-layer is-data", label: "데이터" },
  { key: "intel", i: 1, z: 2, className: "dp-layer", label: "지능" },
  { key: "exp", i: 2, z: 3, className: "dp-layer", label: "경험" },
  { key: "platform", i: 3, z: 4, className: "dp-layer is-top", label: "플랫폼" },
];

type Props = { locale: Locale };

export function Hero({ locale }: Props) {
  const storyRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const story = storyRef.current;
    const stage = stageRef.current;
    const deck = deckRef.current;
    if (!story || !stage || !deck) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

    // ── entrance: the deck flies in once, layer by layer, then hands off
    // to scroll-driven sync. Timing matches the ported CSS keyframe
    // (animation-delay: --i*.34s+.3s, duration 2.2s) plus a small buffer.
    let enterTimer = 0;
    if (!motion.matches) {
      deck.classList.add("is-entering");
      enterTimer = window.setTimeout(() => {
        deck.classList.remove("is-entering");
        sync();
      }, 300 + 3 * 340 + 2200 + 60);
    }

    function progress(): number {
      const rect = story!.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(stage!).top) || 0;
      const travel = story!.offsetHeight - stage!.offsetHeight;
      if (travel <= 0) return 0;
      return clamp((top - rect.top) / travel);
    }

    function paintChapters(p: number) {
      const pos = p * 2.5;
      CHAPTERS.forEach((_, i) => {
        const el = chapterRefs.current[i];
        if (!el) return;
        const d = pos - i;
        const o = clamp(1 - Math.abs(d) * 1.6);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${-d * 30}px)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        el.setAttribute("aria-hidden", String(o < 0.5));
      });
      if (p > 0.8) {
        const el = chapterRefs.current[2];
        if (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.pointerEvents = "auto";
          el.setAttribute("aria-hidden", "false");
        }
      }
    }

    function paintTimeline(p: number) {
      timelineRefs.current.forEach((el, i) => {
        if (!el) return;
        const fill = clamp(p * 3 - i);
        el.style.setProperty("--fill", String(fill));
        el.classList.toggle("active", Math.min(2, Math.floor(p * 3)) === i);
      });
    }

    // Deck sync: which layer is "on" follows the same reading chapter the
    // paint above just chose (one source of truth, unlike the original's
    // separate MutationObserver re-deriving it from the DOM). prog is a
    // continuous 0..1 read of where the cross-fade sits (not just which
    // chapter wins), so the whole deck stays in motion, not just the
    // lifted card; tail is the last chapter's long scroll-past, read from
    // raw position since the opacities have saturated by then.
    function sync() {
      const p = progress();
      const pos = p * 2.5;
      let wsum = 0,
        osum = 0,
        onIdx = 0,
        best = -1;
      CHAPTERS.forEach((_, i) => {
        const d = pos - i;
        const o = clamp(1 - Math.abs(d) * 1.6);
        wsum += i * o;
        osum += o;
        if (o > best) {
          best = o;
          onIdx = i;
        }
      });
      if (p > 0.8) onIdx = 2;
      const span = Math.max(1, CHAPTERS.length - 1);
      const prog = clamp((osum ? wsum / osum : 0) / span);
      const tail = clamp((p - 0.78) / 0.22);

      LAYERS.forEach((layer, n) => {
        const el = layerRefs.current[n];
        if (!el) return;
        let lz = prog * (n - 1.5) * 16;
        if (n === LAYERS.length - 2) lz -= tail * 76;
        el.style.setProperty("--lz", `${lz.toFixed(1)}px`);
        el.classList.toggle("is-on", n === onIdx);
      });
    }

    function render() {
      if (motion.matches) {
        chapterRefs.current.forEach((el) => el?.setAttribute("aria-hidden", "false"));
        return;
      }
      const p = progress();
      paintChapters(p);
      paintTimeline(p);
      sync();
    }

    let ticking = false;
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        render();
      });
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    motion.addEventListener("change", request);
    render();

    return () => {
      window.clearTimeout(enterTimer);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      motion.removeEventListener("change", request);
    };
  }, []);

  function goToScene(i: number) {
    const story = storyRef.current;
    const stage = stageRef.current;
    if (!story || !stage) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const top = parseFloat(getComputedStyle(stage).top) || 0;
    const start = window.scrollY + story.getBoundingClientRect().top - top;
    const travel = story.offsetHeight - stage.offsetHeight;
    window.scrollTo({
      top: start + travel * [0, 0.4, 0.82][i],
      behavior: motion.matches ? "instant" : "smooth",
    });
  }

  return (
    <div className="story" ref={storyRef} aria-label="Intelligence in motion">
      <div className="stage" ref={stageRef}>
        <div className="stage-visual" aria-hidden="true">
          <div className="hero-art">
            <HeroMark />
            <div className="cap">
              <span>Wave Intelligence</span>
              <span>데이터의 흐름이 W가 됩니다</span>
              <span className="scroll-hint">스크롤하여 탐색 ↓</span>
            </div>
          </div>

          <div className="dp-stack" aria-hidden="true">
            <div className="dp-deck" ref={deckRef}>
              <span className="dp-aura" />
              {LAYERS.map((layer, n) => (
                <div
                  key={layer.key}
                  className={layer.className}
                  ref={(el) => {
                    layerRefs.current[n] = el;
                  }}
                  style={{ ["--i" as never]: layer.i, ["--z" as never]: layer.z }}
                >
                  {layer.key === "data" && <span className="dp-ripple" />}
                  <span className="dp-label">{layer.label}</span>
                  {layer.key === "intel" && (
                    <span className="dp-wire">
                      <i />
                      <i />
                      <i />
                      <b />
                      <b />
                      <b />
                    </span>
                  )}
                  {layer.key === "platform" && (
                    <svg className="dp-mark" viewBox="0 0 91 55" aria-hidden="true">
                      <use href="#logo-icon-black" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <p className="dp-caption">데이터 → 지능 → 경험</p>
          </div>
        </div>

        <div className="node-tips" aria-label="W Labs snippets" />

        <div className="wrap stage-grid">
          <div className="stage-copy">
            <div className="chapters">
              {CHAPTERS.map((chapter, i) => (
                <article
                  key={i}
                  className="chapter"
                  ref={(el) => {
                    chapterRefs.current[i] = el;
                  }}
                >
                  <span className="eyebrow">{chapter.eyebrow}</span>
                  {chapter.heading}
                  <p className="lead">{chapter.lead}</p>
                </article>
              ))}
            </div>
            <div className="hero-cta">
              <Link className="btn btn-primary" href={withLocale("/contact", locale)}>
                <span>프로젝트 상담하기</span>
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
              </Link>
              <Link className="btn btn-ghost" href={withLocale("/work", locale)}>
                <span>하는 일 보기</span>
                <span className="arr" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
            <nav className="timeline" aria-label="장면 이동">
              {SCENES.map((label, i) => (
                <a
                  key={i}
                  href="#story"
                  ref={(el) => {
                    timelineRefs.current[i] = el;
                  }}
                  className={i === 0 ? "active" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goToScene(i);
                  }}
                >
                  {String(i + 1).padStart(2, "0")} <b>{label}</b>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
