"use client";

import { useEffect, useRef, useState } from "react";

export type StackItem = {
  key: string;
  weight?: number;
  number: string;
  question: React.ReactNode;
  questionText: string;
  teaser: React.ReactNode;
  teaserText: string;
  answer: React.ReactNode;
  answerText: string;
  note?: React.ReactNode;
  ctas?: { href: string; label: string; ghost?: boolean }[];
};

type Props = {
  items: StackItem[];
};

// ── service bands, as a frequency-band stack ────────────────────────────
// Ported from src/mods/mod-band.html: "any number of stacks can live on a
// page; every .sp-bands root is wired independently" — the class names
// (.sp-bands-stack/.sp-band/.sp-band-*) are fixed, reused as-is for every
// instance (Home's 5 services here; the design repo's own CSS shows the
// same classes reused again for Contact's larger FAQ-as-bands stack,
// #sp-bands-faq, not yet ported — hence no per-instance "prefix": there
// isn't one in the source, only different container ids).
//
// Texture: columns are time through the item's own question+answer text,
// rows are frequency bins; a character's code lights a row with a weight
// that fades along a sliding window, so it streaks across a few columns
// like a partial in a real spectrogram — deterministic, and it changes
// with the language because the text does.
//
// Lighting: a cos² gain window sweeps left→right; cells spark and decay.
// Painting is dirty-rect (only the sweep's current + previous strip, plus
// any live sparks), ~30fps, paused off-screen/tab-hidden/reduced-motion —
// unchanged from the source. Ported to one instance per mounted component
// (own IntersectionObserver/ResizeObserver/rAF, torn down on unmount)
// rather than the source's page-wide instance registry.

const G_SWEEP = 2.2;
const SWEEP_W = 170;
const FRAME_MS = 33;
const BASE_HEIGHT = 104; // mod-band.html's sizeBands(): Math.round(104 * weight)

type Texture = {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  cw: number;
  ch: number;
  g: number;
  cols: number;
  rows: number;
  v: Float32Array;
  period: number;
  phase: number;
  sparks: { c: number; j: number; t0: number; dur: number }[];
  nextSpark: number;
  prev: [number, number] | null;
  visible: boolean;
};

function buildTexture(head: HTMLElement, canvas: HTMLCanvasElement, text: string): Texture | null {
  const W = Math.max(1, Math.round(head.clientWidth));
  const H = Math.max(1, Math.round(head.clientHeight));
  if (W < 2 || H < 2) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const codes: number[] = [];
  for (let i = 0; i < text.length; i++) codes.push(text.codePointAt(i) ?? 0);
  const n = codes.length;
  if (!n) return null;

  const cw = 4,
    ch = 3,
    g = 1;
  const cols = Math.ceil(W / (cw + g));
  const rows = Math.max(4, Math.ceil(H / (ch + g)));
  const step = Math.max(1, Math.floor(n / cols));
  const win = Math.max(10, step * 6);
  const v = new Float32Array(cols * rows);
  const acc = new Float32Array(rows);

  for (let c = 0; c < cols; c++) {
    acc.fill(0);
    for (let k = 0; k < win; k++) {
      const code = codes[(c * step + k) % n];
      const w = 1 - k / win;
      const r = code * 7 % rows;
      acc[r] += w;
      if (r > 0) acc[r - 1] += w * 0.35;
      if (r < rows - 1) acc[r + 1] += w * 0.35;
    }
    const norm = win * 0.28;
    for (let j = 0; j < rows; j++) {
      let a = Math.min(1, acc[j] / norm);
      a = Math.pow(a, 1.35);
      v[c * rows + j] = a < 0.08 ? 0 : 0.05 + a * 0.85;
    }
  }

  return {
    ctx,
    W,
    H,
    cw,
    ch,
    g,
    cols,
    rows,
    v,
    period: 5.5 + Math.random() * 6,
    phase: Math.random(),
    sparks: [],
    nextSpark: 0,
    prev: null,
    visible: true,
  };
}

function paintCols(st: Texture, c0: number, c1: number, xc: number | null) {
  const { ctx, cw, ch, g, rows, v } = st;
  c0 = Math.max(0, c0);
  c1 = Math.min(st.cols - 1, c1);
  if (c1 < c0) return;
  const x0 = c0 * (cw + g);
  ctx.clearRect(x0, 0, (c1 + 1) * (cw + g) - x0, st.H);
  for (let c = c0; c <= c1; c++) {
    let gain = 1;
    if (xc != null) {
      const d = Math.abs(c * (cw + g) + cw / 2 - xc) / SWEEP_W;
      if (d < 1) {
        const f = Math.cos((d * Math.PI) / 2);
        gain = 1 + G_SWEEP * f * f;
      }
    }
    const x = c * (cw + g);
    const base = c * rows;
    for (let j = 0; j < rows; j++) {
      const a = v[base + j];
      if (!a) continue;
      ctx.fillStyle = `rgba(0,212,255,${Math.min(1, a * gain).toFixed(3)})`;
      ctx.fillRect(x, st.H - (j + 1) * (ch + g), cw, ch);
    }
  }
}

export function SpectrogramStack({ items }: Props) {
  const rootRef = useRef<HTMLOListElement | null>(null);
  const headRefs = useRef(new Map<string, HTMLDivElement>());
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const [openKey, setOpenKey] = useState<string | null>(null);
  const relayoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const textures = new Map<string, Texture>();
    let raf = 0;
    let last = 0;

    function textOf(item: StackItem) {
      return `${item.questionText} ${item.answerText}`.replace(/\s+/g, " ").trim();
    }

    function draw(item: StackItem) {
      const head = headRefs.current.get(item.key);
      const canvas = canvasRefs.current.get(item.key);
      if (!head || !canvas) return;
      const st = buildTexture(head, canvas, textOf(item));
      if (st) {
        const old = textures.get(item.key);
        st.visible = old ? old.visible : true;
        textures.set(item.key, st);
        paintCols(st, 0, st.cols - 1, null);
      }
    }

    function rest(key: string) {
      const st = textures.get(key);
      if (!st) return;
      st.sparks.length = 0;
      st.prev = null;
      paintCols(st, 0, st.cols - 1, null);
    }

    function frame(key: string, tSec: number) {
      const st = textures.get(key);
      if (!st) return;
      const cg = st.cw + st.g;
      const p = ((tSec / st.period + st.phase) % 1 + 1) % 1;
      const xc = p * (st.W + 2 * SWEEP_W) - SWEEP_W;
      let c0 = Math.floor((xc - SWEEP_W) / cg) - 1;
      let c1 = Math.ceil((xc + SWEEP_W) / cg) + 1;
      if (st.prev) {
        c0 = Math.min(c0, st.prev[0]);
        c1 = Math.max(c1, st.prev[1]);
      }
      paintCols(st, c0, c1, xc);
      st.prev = [c0, c1];
      if (tSec >= st.nextSpark) {
        st.nextSpark = tSec + 0.04 + Math.random() * 0.14;
        for (let i = 0; i < 4; i++) {
          const c = (Math.random() * st.cols) | 0;
          const j = (Math.random() * st.rows) | 0;
          if (st.v[c * st.rows + j]) st.sparks.push({ c, j, t0: tSec, dur: 0.35 + Math.random() * 0.55 });
        }
      }
      for (let s = st.sparks.length - 1; s >= 0; s--) {
        const sp = st.sparks[s];
        const kk = (tSec - sp.t0) / sp.dur;
        const bv = st.v[sp.c * st.rows + sp.j];
        const x = sp.c * cg;
        const y = st.H - (sp.j + 1) * (st.ch + st.g);
        st.ctx.clearRect(x, y, st.cw, st.ch);
        let a = bv;
        if (kk >= 1) st.sparks.splice(s, 1);
        else {
          const env = Math.sin(kk * Math.PI);
          a = Math.min(1, bv + (1 - bv) * env * 0.95);
        }
        st.ctx.fillStyle = `rgba(0,212,255,${a.toFixed(3)})`;
        st.ctx.fillRect(x, y, st.cw, st.ch);
      }
    }

    function anyVisible() {
      for (const st of textures.values()) if (st.visible) return true;
      return false;
    }
    function loop(ms: number) {
      raf = requestAnimationFrame(loop);
      if (ms - last < FRAME_MS) return;
      last = ms;
      const t = ms / 1000;
      for (const [key, st] of textures) if (st.visible) frame(key, t);
    }
    function start() {
      if (!raf && !reduce.matches && !document.hidden && anyVisible()) raf = requestAnimationFrame(loop);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function drawAll() {
      items.forEach(draw);
    }

    const io = new IntersectionObserver(
      (ents) => {
        for (const ent of ents) {
          const key = (ent.target as HTMLElement).dataset.stackKey;
          if (!key) continue;
          const st = textures.get(key);
          if (!st) continue;
          st.visible = ent.isIntersecting;
          if (!st.visible) rest(key);
        }
        if (anyVisible()) start();
        else stop();
      },
      { rootMargin: "140px" },
    );
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        drawAll();
        start();
      }, 80);
    });

    drawAll();
    for (const item of items) {
      const head = headRefs.current.get(item.key);
      if (head) {
        head.dataset.stackKey = item.key;
        io.observe(head);
        ro.observe(head);
      }
    }
    start();
    relayoutRef.current = () => {
      drawAll();
      start();
    };

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    function onReduce() {
      if (reduce.matches) {
        stop();
        items.forEach((i) => rest(i.key));
      } else start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
    };
    // items are fixed per page — this stack doesn't need to react to them
    // changing identity, only to mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-measure heads at their new size once the open/close transition
  // finishes (heads change height, so the running texture must rebuild).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => relayoutRef.current(), 440);
    return () => clearTimeout(t);
  }, [openKey]);

  function toggle(key: string) {
    setOpenKey((cur) => (cur === key ? null : key));
  }

  // Escape closes the open band and returns focus to its trigger button —
  // v3's stack-root keydown (WOS-336, index.html:4468-4472). On the ROOT,
  // not the document, so it only fires while focus is inside this stack
  // and two stacks on one page never fight; no preventDefault, matching
  // the source (the sheet's own Escape handler is hidden-guarded anyway).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Escape" || openKey === null) return;
    const btn = rootRef.current?.querySelector<HTMLButtonElement>(".sp-band.is-open .sp-band-btn");
    setOpenKey(null);
    btn?.focus();
  }

  return (
    <ol ref={rootRef} className="sp-bands-stack" onKeyDown={onKeyDown}>
      {items.map((item) => {
        const isOpen = openKey === item.key;
        const height = Math.round(BASE_HEIGHT * (item.weight ?? 1));
        return (
          <li
            key={item.key}
            className={isOpen ? "sp-band is-open" : "sp-band"}
            data-stack-key={item.key}
          >
            <div
              className="sp-band-head"
              ref={(el) => {
                if (el) headRefs.current.set(item.key, el);
                else headRefs.current.delete(item.key);
              }}
              style={{ ["--sp-band-h" as never]: `${height}px` }}
            >
              <canvas
                className="sp-band-canvas"
                aria-hidden="true"
                ref={(el) => {
                  if (el) canvasRefs.current.set(item.key, el);
                  else canvasRefs.current.delete(item.key);
                }}
              />
              <button
                className="sp-band-btn"
                type="button"
                aria-expanded={isOpen}
                aria-controls={`sp-band-p-${item.key}`}
                onClick={() => toggle(item.key)}
              >
                <span className="sp-band-n">{item.number}</span>
                <span className="sp-band-q">
                  <b>{item.question}</b>
                  <span className="sp-band-teaser">{item.teaser}</span>
                </span>
              </button>
            </div>
            <div className="sp-band-panel" id={`sp-band-p-${item.key}`}>
              <div className="sp-collapse-in">
                {item.answer}
                {item.note && <p className="sp-band-note">{item.note}</p>}
                {item.ctas && (
                  <div className="sp-band-ctas">
                    {item.ctas.map((cta) => (
                      <a
                        key={cta.href + cta.label}
                        className={cta.ghost ? "sp-band-cta is-ghost" : "sp-band-cta"}
                        href={cta.href}
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
