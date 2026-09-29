"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
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

// Each chapter's `heading` is the {lead, accent, tail} triple
// dictionary.ts splits heroH1/ch2h/ch3h into — see its HEADING_RE comment
// for why (v3's markup-bearing headings, ported without
// dangerouslySetInnerHTML).
function buildChapters(s: SiteStrings["home"]) {
  return [
    { eyebrow: s.ch1e, heading: s.heading1, lead: s.heroLead },
    { eyebrow: s.ch2e, heading: s.heading2, lead: s.ch2p },
    { eyebrow: s.ch3e, heading: s.heading3, lead: s.ch3p },
  ];
}

// Layer 0 = data floor, 1 = intelligence, 2 = experience, 3 = platform
// (never lifted — it's what everything else lands on). --i/--z are the
// deck's own static stacking tokens; --lz is the one this component drives.
const LAYER_META = [
  { key: "data", i: 0, z: 1, className: "dp-layer is-data" },
  { key: "intel", i: 1, z: 2, className: "dp-layer" },
  { key: "exp", i: 2, z: 3, className: "dp-layer" },
  { key: "platform", i: 3, z: 4, className: "dp-layer is-top" },
] as const;

function buildLayers(s: SiteStrings["home"]) {
  const labels = [s.dpL1, s.dpL2, s.dpL3, s.dpL4];
  return LAYER_META.map((meta, i) => ({ ...meta, label: labels[i] }));
}

// Counts only, for the scroll-driven effect below — buildChapters(s)/
// buildLayers(s) return per-locale copy, so their arrays aren't stable
// across renders and can't be an effect dependency, but the effect never
// reads anything from them besides "how many" (chapter/layer index math,
// no text) — these constants let it stay independent of `s` without
// silencing react-hooks/exhaustive-deps.
const CHAPTER_COUNT = 3;
const LAYER_COUNT = LAYER_META.length;

type Props = { locale: Locale; s: SiteStrings["home"] };

export function Hero({ locale, s }: Props) {
  const CHAPTERS = buildChapters(s);
  const SCENES = [s.sc1, s.sc2, s.sc3];
  const LAYERS = buildLayers(s);
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
      for (let i = 0; i < CHAPTER_COUNT; i++) {
        const el = chapterRefs.current[i];
        if (!el) continue;
        const d = pos - i;
        const o = clamp(1 - Math.abs(d) * 1.6);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${-d * 30}px)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        el.setAttribute("aria-hidden", String(o < 0.5));
      }
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
      for (let i = 0; i < CHAPTER_COUNT; i++) {
        const d = pos - i;
        const o = clamp(1 - Math.abs(d) * 1.6);
        wsum += i * o;
        osum += o;
        if (o > best) {
          best = o;
          onIdx = i;
        }
      }
      if (p > 0.8) onIdx = 2;
      const span = Math.max(1, CHAPTER_COUNT - 1);
      const prog = clamp((osum ? wsum / osum : 0) / span);
      const tail = clamp((p - 0.78) / 0.22);

      for (let n = 0; n < LAYER_COUNT; n++) {
        const el = layerRefs.current[n];
        if (!el) continue;
        let lz = prog * (n - 1.5) * 16;
        if (n === LAYER_COUNT - 2) lz -= tail * 76;
        el.style.setProperty("--lz", `${lz.toFixed(1)}px`);
        el.classList.toggle("is-on", n === onIdx);
      }
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
    <div className="story" ref={storyRef} aria-label={s.storyAriaLabel}>
      <div className="stage" ref={stageRef}>
        <div className="stage-visual" aria-hidden="true">
          <div className="hero-art">
            <HeroMark />
            <div className="cap">
              {/* "Wave Intelligence" is the brand tagline — v3 never
                  dictionary-izes it (no data-i), it's the same literal
                  in both languages. See dictionary.generated.ts's own
                  scan for how heroCap/scrollHint were harvested. */}
              <span>Wave Intelligence</span>
              <span>{s.heroCap}</span>
              <span className="scroll-hint">{s.scrollHint}</span>
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
            <p className="dp-caption">{s.dpCap}</p>
          </div>
        </div>

        <div className="node-tips" aria-label={s.snippetsAriaLabel} />

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
                  {i === 0 ? (
                    <h1>
                      {chapter.heading.lead}
                      <br />
                      <span className="accent">{chapter.heading.accent}</span>
                      {chapter.heading.tail}
                    </h1>
                  ) : (
                    <h2>
                      {chapter.heading.lead}
                      <br />
                      <span className="accent">{chapter.heading.accent}</span>
                      {chapter.heading.tail}
                    </h2>
                  )}
                  <p className="lead">{chapter.lead}</p>
                </article>
              ))}
            </div>
            <div className="hero-cta">
              <Link className="btn btn-primary" href={withLocale("/contact", locale)}>
                <span>{s.ctaDiscuss}</span>
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
              </Link>
              <Link className="btn btn-ghost" href={withLocale("/work", locale)}>
                <span>{s.ctaWork}</span>
                <span className="arr" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
            <nav className="timeline" aria-label={s.scenesAriaLabel}>
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
