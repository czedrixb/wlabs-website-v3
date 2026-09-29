"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { SnippetPoolItem } from "@/lib/site/snippetPool";
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
// node-tips (the floating snippet callouts riding the wave paths) is its
// own effect below, once PROJECTS/PRODUCTS/TEAM/SERVICES existed as typed
// constants to deal from (WOS-332) — deliberately skipped by WOS-314 for
// the same reason.

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

type Props = { locale: Locale; s: SiteStrings["home"]; pool: SnippetPoolItem[] };

export function Hero({ locale, s, pool }: Props) {
  const CHAPTERS = buildChapters(s);
  const SCENES = [s.sc1, s.sc2, s.sc3];
  const LAYERS = buildLayers(s);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const timelineRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const tipLayerRef = useRef<HTMLDivElement | null>(null);

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

  // ── node-tips: snippet callouts riding the hero mark's wave paths ──────
  // Ported from site/index.html's node system (`nodes()`/`nodesReact()`/
  // `placeTips()`) and its snippet dealer (`buildPool()`/`draw()`/
  // `fillTip()`/`swapTip()`). `pool` is already resolved to the active
  // locale (buildSnippetPool, src/lib/site/snippetPool.ts) — unlike the
  // source, nothing here needs a runtime language check.
  //
  // Kept as its own effect/closure rather than folded into the one above:
  // the two systems don't share state in the source either (separate
  // top-level IIFEs), and this one owns a continuous rAF loop for idle
  // drift that the chapter/timeline/deck sync above doesn't need — it only
  // repaints on scroll/resize. `progress()` is duplicated rather than
  // shared for the same reason: each effect mounts/unmounts independently.
  //
  // Everything here is DOM-imperative (circles, .ntip divs built via
  // document.createElement, never React state) exactly like the source —
  // and unlike the chapter effect's JSX-rendered refs, that also means
  // there is nothing to hydrate: the .node-tips layer renders empty on the
  // server, so there is no SSR/client mismatch to guard against here, only
  // client-only DOM writes after mount.
  useEffect(() => {
    const stage = stageRef.current;
    const story = storyRef.current;
    const tipLayer = tipLayerRef.current;
    if (!stage || !story || !tipLayer || pool.length === 0) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // v3 never builds the node/tip system at all under reduced motion
    // (render() returns before reaching it) — CSS also hides `.node-tips`
    // outright in that case, so skipping the setup here just avoids
    // pointless work behind display:none.
    if (motion.matches) return;

    const markEl = stage.querySelector<SVGSVGElement>(".hero-mono");
    const nodesGroup = markEl?.querySelector<SVGGElement>(".nodes") ?? null;
    const paths = markEl ? [...markEl.querySelectorAll<SVGPathElement>(".wave-path")] : [];
    if (!markEl || !nodesGroup || paths.length === 0) return;
    // Rebind stage/story/mark to fresh, non-nullable consts: TS's narrowing
    // above (the `if (!x) return` guards) doesn't carry into the nested
    // function declarations below (progress/svgPoint/placeTips/loop) —
    // shadowing with a binding whose type has no `null` in it sidesteps
    // that rather than re-asserting non-null at every call site.
    const stageEl: HTMLDivElement = stage;
    const storyEl: HTMLDivElement = story;
    const tipLayerEl: HTMLDivElement = tipLayer;
    const mark: SVGSVGElement = markEl;

    const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
    const NS = "http://www.w3.org/2000/svg";

    // One leading + one trailing node per wave path.
    const circles: SVGCircleElement[] = [];
    paths.forEach((_, i) => {
      for (const k of [0, 1]) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("r", k ? "1.8" : "2.4");
        c.dataset.path = String(i);
        c.dataset.offset = String((i * 0.19 + k * 0.5) % 1);
        circles.push(c);
      }
    });
    nodesGroup.replaceChildren(...circles);

    // The snippet dealer: a shuffled deck, no repeats until it's exhausted.
    let deck: number[] = [];
    const shown = new Set<number>();
    function draw(): number {
      if (!deck.length) {
        deck = pool.map((_, i) => i);
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
      }
      let k = deck.findIndex((i) => !shown.has(i));
      if (k < 0) k = 0;
      return deck.splice(k, 1)[0];
    }
    function fillTip(tip: HTMLDivElement, poolIndex: number) {
      const item = pool[poolIndex];
      tip.dataset.pool = String(poolIndex);
      tip.innerHTML =
        `<span class="ntip-lead"></span>` +
        `<a class="ntip-box" href="${item.href}"><span class="k">${item.kind} <b>${item.title}</b></span>` +
        `<span class="sub">${item.sub}</span></a>`;
    }
    function swapTip(tip: HTMLDivElement) {
      const old = Number(tip.dataset.pool);
      shown.delete(old);
      const i = draw();
      shown.add(i);
      fillTip(tip, i);
    }

    const tips: HTMLDivElement[] = circles.map(() => {
      const w = document.createElement("div");
      w.className = "ntip";
      const i = draw();
      shown.add(i);
      fillTip(w, i);
      return w;
    });
    tipLayerEl.replaceChildren(...tips);

    // Pointer parallax: nodes swell near the cursor; idle drift keeps the
    // flow moving even without scroll or pointer input.
    let ptr: { cx: number; cy: number } | null = null;
    function onPointerMove(e: PointerEvent) {
      ptr = { cx: e.clientX, cy: e.clientY };
    }
    function onPointerLeave() {
      ptr = null;
    }
    stageEl.addEventListener("pointermove", onPointerMove, { passive: true });
    stageEl.addEventListener("pointerleave", onPointerLeave);

    function svgPoint(): DOMPoint | null {
      if (!ptr) return null;
      try {
        const m = mark.getScreenCTM();
        if (!m) return null;
        const pt = mark.createSVGPoint();
        pt.x = ptr.cx;
        pt.y = ptr.cy;
        return pt.matrixTransform(m.inverse());
      } catch {
        return null;
      }
    }

    function progress(): number {
      const rect = storyEl.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(stageEl).top) || 0;
      const travel = storyEl.offsetHeight - stageEl.offsetHeight;
      if (travel <= 0) return 0;
      return clamp((top - rect.top) / travel);
    }

    let drift = 0;

    function moveNodes(p: number) {
      for (let idx = 0; idx < circles.length; idx++) {
        const c = circles[idx];
        const path = paths[Number(c.dataset.path)];
        const L = path.getTotalLength();
        const offset = Number(c.dataset.offset);
        const t = (((offset + p * 0.25 + drift) % 1) + 1) % 1;
        const pt = path.getPointAtLength(L * t);
        c.setAttribute("cx", String(pt.x));
        c.setAttribute("cy", String(pt.y));
        const prevT = c.dataset.t === undefined ? t : Number(c.dataset.t);
        c.dataset.t = String(t);
        if (t < prevT - 0.5) swapTip(tips[idx]);
      }
    }

    function nodesReact() {
      const sp = svgPoint();
      for (const c of circles) {
        const base = Number(c.dataset.offset) >= 0.5 ? 1.8 : 2.4;
        if (!sp) {
          c.setAttribute("r", String(base));
          c.classList.remove("near");
          c.dataset.k = "0";
          continue;
        }
        const cx = Number(c.getAttribute("cx"));
        const cy = Number(c.getAttribute("cy"));
        const d = Math.hypot(cx - sp.x, cy - sp.y);
        const k = clamp(1 - d / 45);
        c.setAttribute("r", String(base * (1 + k * 1.6)));
        c.classList.toggle("near", k > 0.35);
        c.dataset.k = k.toFixed(2);
      }
    }

    function placeTips() {
      let m: DOMMatrix | null;
      try {
        m = mark.getScreenCTM();
      } catch {
        return;
      }
      if (!m) return;
      const sr = stageEl.getBoundingClientRect();
      const wide = sr.width >= 744;
      circles.forEach((c, i) => {
        const pt = mark.createSVGPoint();
        pt.x = Number(c.getAttribute("cx"));
        pt.y = Number(c.getAttribute("cy"));
        const sp = pt.matrixTransform(m!);
        const x = sp.x - sr.left;
        const y = sp.y - sr.top;
        const k = Number(c.dataset.k || 0);
        const zone = wide ? clamp((x / sr.width - 0.5) / 0.15) : clamp((y / sr.height - 0.55) / 0.15);
        const edge = clamp((sr.width - x - 40) / 160) * clamp((y - 90) / 60);
        const tip = tips[i];
        tip.style.transform = `translate3d(${x}px,${y}px,0)`;
        tip.style.setProperty("--vis", (Math.max(zone, k) * edge * 0.9).toFixed(2));
      });
    }

    let paused = false;
    function onPointerOver(e: PointerEvent) {
      if ((e.target as HTMLElement).closest(".ntip-box")) paused = true;
    }
    function onPointerOut(e: PointerEvent) {
      const stillInside = (e.relatedTarget as HTMLElement | null)?.closest?.(".ntip-box");
      if ((e.target as HTMLElement).closest(".ntip-box") && !stillInside) paused = false;
    }
    tipLayerEl.addEventListener("pointerover", onPointerOver);
    tipLayerEl.addEventListener("pointerout", onPointerOut);

    let raf = 0;
    let last = performance.now();
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const rect = stageEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (!paused) drift += dt * 0.03;
      const p = progress();
      moveNodes(p);
      nodesReact();
      placeTips();
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      stageEl.removeEventListener("pointermove", onPointerMove);
      stageEl.removeEventListener("pointerleave", onPointerLeave);
      tipLayerEl.removeEventListener("pointerover", onPointerOver);
      tipLayerEl.removeEventListener("pointerout", onPointerOut);
    };
    // `pool` is built server-side once per request and stable for the
    // component's lifetime — this effect only needs to (re)run if its
    // identity actually changes.
  }, [pool]);

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

        <div className="node-tips" aria-label={s.snippetsAriaLabel} ref={tipLayerRef} />

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
