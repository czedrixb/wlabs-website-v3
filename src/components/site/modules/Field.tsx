"use client";

import { useEffect, useRef } from "react";

type Props = {
  dark?: boolean;
  caption?: string;
  children?: React.ReactNode;
};

// ── two-source interference field ──────────────────────────────────────
// Ported from src/mods/mod-field.html: two point sources with 1/sqrt(r)
// falloff, summed and rendered into an offscreen canvas at 1/3 resolution,
// then scaled up. Section-scoped rather than document-scoped (the source
// read progress across the whole page; here it's the one section crossing
// the viewport), everything else — the colour-stop arrays, the legibility
// gain envelope, the render math — is unchanged.
//
// Ported to a single component instance (a page mounts one <Field> per
// section) rather than the source's page-wide instance registry + one
// shared rAF loop: React's mount/unmount already gives each instance its
// own lifecycle, so there's no registry to maintain, and the effect tears
// its own listeners/observers/rAF down on unmount — the vanilla version
// never needed to, since the whole page was the app.

const SCALE = 3;
const FPS_MS = 32;
const SPEED = 30;
const G_TOP = 0.44;
const G_BOT = 0.18;
const STATIC_P = 0.55;

// Canvas colour stops — NOT CSS custom properties, deliberately: they feed
// ImageData directly and must survive independent of any theme/greyscale
// pass. WOS-336: the shipped theme8 palette (site/index.html ~3979) — the
// earlier pre-Depth study triples read far too dark/indigo next to the
// reference's steel-and-teal field.
const C_CREAM: [number, number, number] = [244, 247, 249]; // --cream #F4F7F9, light ground
const C_LTROUGH: [number, number, number] = [186, 212, 226]; // steel trough of the light field
const C_LCREST: [number, number, number] = [253, 254, 255]; // near-white crest of the light field
const C_NAVY2: [number, number, number] = [29, 59, 78]; // --navy-2 #1D3B4E, dark ground
const C_DTROUGH: [number, number, number] = [10, 24, 33]; // deepest trough of the dark field
const C_DCREST: [number, number, number] = [26, 135, 196]; // teal-lifted crest of the dark field

const LN = 2048;
const SIN = new Float32Array(LN);
const ILUT = LN / (Math.PI * 2);
for (let i = 0; i < LN; i++) SIN[i] = Math.sin((i * Math.PI * 2) / LN);

const LE = (() => {
  const b = new ArrayBuffer(4);
  const u8 = new Uint8Array(b);
  const u32 = new Uint32Array(b);
  u32[0] = 0x01020304;
  return u8[0] === 4;
})();

function pack(r: number, g: number, b: number): number {
  return (
    (LE ? (255 << 24) | (b << 16) | (g << 8) | r : (r << 24) | (g << 16) | (b << 8) | 255) >>> 0
  );
}

function mkPalette(
  mid: [number, number, number],
  neg: [number, number, number],
  pos: [number, number, number],
): Uint32Array {
  const arr = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const n = i / 127.5 - 1;
    let r: number, g: number, b: number;
    if (n < 0) {
      const a = -n;
      r = mid[0] + (neg[0] - mid[0]) * a;
      g = mid[1] + (neg[1] - mid[1]) * a;
      b = mid[2] + (neg[2] - mid[2]) * a;
    } else {
      const a = n;
      r = mid[0] + (pos[0] - mid[0]) * a;
      g = mid[1] + (pos[1] - mid[1]) * a;
      b = mid[2] + (pos[2] - mid[2]) * a;
    }
    arr[i] = pack(r | 0, g | 0, b | 0);
  }
  return arr;
}

const PAL_L = mkPalette(C_CREAM, C_LTROUGH, C_LCREST);
const PAL_D = mkPalette(C_NAVY2, C_DTROUGH, C_DCREST);

export function Field({ dark, caption, children }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cv = canvasRef.current;
    if (!root || !cv) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const off = document.createElement("canvas");
    let ctx: CanvasRenderingContext2D | null = null;
    let octx: CanvasRenderingContext2D | null = null;
    let img: ImageData | null = null;
    let buf: Uint32Array | null = null;
    let LW = 0,
      LH = 0,
      w = 0,
      h = 0,
      sx = 1,
      sy = 1;
    let p = 0;
    let visible = false;
    let ok = false;
    let last = -1e9;
    let raf = 0;
    let running = false;
    let t0 = 0;

    function size(): boolean {
      const r = root!.getBoundingClientRect();
      const nw = Math.max(0, Math.round(r.width));
      const nh = Math.max(0, Math.round(r.height));
      if (!nw || !nh) {
        ok = false;
        return false;
      }
      if (nw === w && nh === h && ok) return true;
      try {
        if (!ctx) ctx = cv!.getContext("2d", { alpha: false });
        if (!octx) octx = off.getContext("2d", { alpha: false });
        if (!ctx || !octx) {
          ok = false;
          return false;
        }
        w = nw;
        h = nh;
        cv!.width = w;
        cv!.height = h;
        LW = Math.max(2, Math.ceil(w / SCALE));
        LH = Math.max(2, Math.ceil(h / SCALE));
        off.width = LW;
        off.height = LH;
        img = octx.createImageData(LW, LH);
        buf = new Uint32Array(img.data.buffer);
        sx = w / LW;
        sy = h / LH;
        ctx.imageSmoothingEnabled = true;
        ok = true;
        return true;
      } catch {
        ok = false;
        return false;
      }
    }

    function progress(): number {
      const r = root!.getBoundingClientRect();
      const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const travel = vh + r.height;
      if (travel <= 0) return 0;
      const pr = (vh - r.top) / travel;
      return pr < 0 ? 0 : pr > 1 ? 1 : pr;
    }

    function render(time: number, pr: number) {
      if (!ok || !buf || !img || !octx || !ctx) return;
      const pal = root!.classList.contains("sp-field--dark") ? PAL_D : PAL_L;
      const md = Math.min(w, h);
      const e = pr * pr * (3 - 2 * pr);

      const s1x = 0.26 * w,
        s1y = 0.3 * h;
      const ax = 0.88 * w,
        ay = 0.8 * h;
      const s2x = ax + (s1x - ax) * e,
        s2y = ay + (s1y - ay) * e;

      const lam = Math.max(26, md * 0.078);
      const k = 6.283185307179586 / lam;
      const wt = k * SPEED * time;
      const ph2 = (1 - pr) * Math.PI;
      const invFall = 1 / (md * 0.34);
      const gain = G_TOP + (G_BOT - G_TOP) * e;

      for (let yy = 0; yy < LH; yy++) {
        const py = yy * sy;
        const dy1 = py - s1y,
          dy2 = py - s2y,
          q1 = dy1 * dy1,
          q2 = dy2 * dy2;
        const row = yy * LW;
        for (let xx = 0; xx < LW; xx++) {
          const px = xx * sx;
          const dx1 = px - s1x,
            dx2 = px - s2x;
          const r1 = Math.sqrt(dx1 * dx1 + q1);
          const r2 = Math.sqrt(dx2 * dx2 + q2);
          const a1 = 1 / Math.sqrt(1 + r1 * invFall);
          const a2 = 1 / Math.sqrt(1 + r2 * invFall);
          const v =
            a1 * SIN[(((k * r1 - wt) * ILUT) | 0) & 2047] +
            a2 * SIN[(((k * r2 - wt + ph2) * ILUT) | 0) & 2047];
          const n = (v / (a1 + a2)) * gain;
          let idx = (n * 127.5 + 127.5) | 0;
          if (idx < 0) idx = 0;
          else if (idx > 255) idx = 255;
          buf[row + xx] = pal[idx];
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, LW, LH, 0, 0, w, h);
    }

    function paintStatic() {
      if (size()) render(0, STATIC_P);
    }

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (!visible || !ok) return;
      if (ts - last < FPS_MS) return;
      last = ts;
      render((ts - t0) / 1000, p);
    }

    function start() {
      if (running || reduce.matches || document.hidden || !visible || !ok) return;
      running = true;
      t0 = performance.now();
      last = -1e9;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    let scrollQueued = false;
    function onScroll() {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        if (visible) p = progress();
      });
    }

    let resizeTimer = 0;
    function relayout() {
      size();
      p = progress();
      if (reduce.matches) paintStatic();
      else if (ok) {
        last = -1e9;
        render(0, p);
      }
      if (reduce.matches) stop();
      else start();
    }
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(relayout, 120);
    }

    const io = new IntersectionObserver(
      (ents) => {
        for (const ent of ents) {
          visible = ent.isIntersecting;
          if (visible) {
            size();
            p = progress();
            if (reduce.matches) paintStatic();
          }
        }
        if (reduce.matches) return;
        if (visible) start();
        else stop();
      },
      { rootMargin: "120px 0px", threshold: 0 },
    );
    io.observe(root);

    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    function onReduceChange() {
      if (reduce.matches) {
        stop();
        paintStatic();
      } else start();
    }
    function onVisibilityChange() {
      if (document.hidden) stop();
      else start();
    }

    size();
    p = progress();
    if (reduce.matches) paintStatic();
    else if (ok) render(0, p);
    if (!reduce.matches) start();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduce.addEventListener("change", onReduceChange);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduce.removeEventListener("change", onReduceChange);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <section ref={rootRef as never} className={dark ? "sp-field sp-field--dark" : "sp-field"}>
      <canvas ref={canvasRef} className="sp-field-canvas" aria-hidden="true" />
      <div className="sp-field-inner">
        {caption && <p className="sp-field-cap">{caption}</p>}
        {children}
      </div>
    </section>
  );
}
