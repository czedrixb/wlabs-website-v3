import type { TunerState } from "./tunerData";

// WOS-336: the tuner's harmonic waveform — v3's wave IIFE
// (site/index.html:5211-5302), verbatim: what → harmonic profile, how far →
// completion (resolved main path vs noisy ghost), how fast → frequency and
// scroll speed. rAF-driven, paused off-screen (IntersectionObserver .05) and
// on a hidden tab, and reduced to a single static frame under
// prefers-reduced-motion. destroy() is the one addition — React unmounts,
// the prototype's page never did.

const W = 800;
const H = 240;
const MID = H / 2;
const N = 180;

type Profile = [number, number][]; // [harmonic multiple, coefficient]

const PROFILES: Record<string, Profile> = {
  neutral: [[1, 1]],
  ai: [
    [1, 1],
    [3, 0.08],
    [5, 0.05],
  ], // near-pure sine
  software: [
    [1, 1],
    [3, 1 / 3],
    [5, 1 / 5],
    [7, 1 / 7],
  ], // square-ish
  imaging: [
    [1, 1],
    [2, -1 / 2],
    [3, 1 / 3],
    [4, -1 / 4],
    [5, 1 / 5],
  ], // sawtooth-ish
  interface: [
    [1, 1],
    [3, -1 / 9],
    [5, 1 / 25],
  ], // triangle
  modernise: [
    [1, 1],
    [1.18, 0.65],
  ], // two tones beating
};

const COMPLETE: Record<string, number> = { idea: 0.28, spec: 0.5, prototype: 0.74, production: 1 };
const FREQ: Record<string, number> = { exploring: 1.6, quarter: 3, urgent: 5.2 };
const SPEED: Record<string, number> = { exploring: 0.9, quarter: 1.4, urgent: 2.4 };

type Params = { complete: number; freq: number; speed: number; amp: number };

export type TunerWave = {
  setTarget: (state: TunerState) => void;
  start: () => void;
  draw: () => void;
  destroy: () => void;
};

export function createTunerWave(opts: {
  svg: SVGSVGElement;
  main: SVGPathElement;
  ghost: SVGPathElement;
  nodes: SVGGElement;
  reduced: MediaQueryList;
}): TunerWave {
  const { svg, main, ghost, nodes, reduced } = opts;

  const cur: Params = { complete: 0.5, freq: 2.2, speed: 1, amp: 0.55 };
  const tgt: Params = { ...cur };
  let fromProfile = PROFILES.neutral;
  let toProfile = PROFILES.neutral;
  let mix = 1;
  let time = 0;
  let last = 0;
  let running = false;
  let visible = true;
  let raf = 0;

  function blendProfiles(a: Profile, b: Profile, m: number): Profile {
    const out = new Map<number, number>();
    a.forEach(([k, c]) => out.set(k, (out.get(k) ?? 0) + c * (1 - m)));
    b.forEach(([k, c]) => out.set(k, (out.get(k) ?? 0) + c * m));
    return [...out.entries()];
  }

  function setTarget(state: TunerState) {
    const p = PROFILES[state.building ?? "neutral"];
    if (p !== toProfile) {
      fromProfile = blendProfiles(fromProfile, toProfile, mix);
      toProfile = p;
      mix = 0;
    }
    tgt.complete = state.stage ? COMPLETE[state.stage] : 0.5;
    tgt.freq = state.pace ? FREQ[state.pace] : 2.2;
    tgt.speed = state.pace ? SPEED[state.pace] : 1;
    tgt.amp = state.building ? 0.72 : 0.5;
    if (reduced.matches) {
      Object.assign(cur, tgt);
      mix = 1;
      draw();
    } else {
      start();
    }
  }

  function sample(u: number, tt: number): number {
    const prof = mix >= 1 ? toProfile : blendProfiles(fromProfile, toProfile, mix);
    const ph = Math.PI * 2 * (u * cur.freq) - tt;
    let y = 0;
    let norm = 0;
    prof.forEach(([k, c]) => {
      y += c * Math.sin(k * ph);
      norm += Math.abs(c);
    });
    return y / Math.max(norm, 1);
  }

  const noise = (i: number, tt: number) => Math.sin(i * 12.9898 + tt * 3.1) * Math.cos(i * 78.233 - tt * 1.7);

  function draw() {
    const env = (u: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.35); // soft ends
    let dMain = "";
    let dGhost = "";
    const peaks: [number, number][] = [];
    let prev = 0;
    let prev2 = 0;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = u * W;
      const resolved = u <= cur.complete;
      const base = sample(u, time) * cur.amp * MID * env(u);
      const y = resolved ? MID - base : MID - (base * 0.45 + noise(i, time) * 6);
      const cmd = (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      if (resolved) dMain += cmd;
      // ghost starts at the completion boundary
      if (!resolved || (i < N && (i + 1) / N > cur.complete)) dGhost += (dGhost ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      if (resolved && i > 1 && (prev - prev2) * (y - prev) < 0 && Math.abs(prev - MID) > MID * 0.25) {
        peaks.push([((i - 1) / N) * W, prev]);
      }
      prev2 = prev;
      prev = y;
    }
    main.setAttribute("d", dMain);
    ghost.setAttribute("d", dGhost);
    // data-node dots at the extrema (a pooled set, max 14)
    const want = peaks.slice(0, 14);
    while (nodes.childElementCount < want.length) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("class", "sp-tuner-node");
      c.setAttribute("r", "4");
      nodes.appendChild(c);
    }
    [...nodes.children].forEach((c, i) => {
      const el = c as SVGCircleElement;
      if (i < want.length) {
        el.setAttribute("cx", want[i][0].toFixed(1));
        el.setAttribute("cy", want[i][1].toFixed(1));
        el.style.display = "";
      } else {
        el.style.display = "none";
      }
    });
  }

  function frame(ts: number) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
    last = ts;
    time += dt * cur.speed * 2.2;
    const k = 1 - Math.pow(0.001, dt); // exponential ease toward targets
    (["complete", "freq", "speed", "amp"] as const).forEach((p) => {
      cur[p] += (tgt[p] - cur[p]) * k;
    });
    if (mix < 1) mix = Math.min(1, mix + dt * 2.2);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible || document.hidden || reduced.matches) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  const io = new IntersectionObserver(
    (es) => {
      visible = es[0].isIntersecting;
      if (visible) start();
      else stop();
    },
    { threshold: 0.05 },
  );
  io.observe(svg);

  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onReduced = () => {
    if (reduced.matches) {
      stop();
      Object.assign(cur, tgt);
      mix = 1;
      draw();
    } else {
      start();
    }
  };
  reduced.addEventListener("change", onReduced);

  draw();

  return {
    setTarget,
    start,
    draw,
    destroy() {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReduced);
    },
  };
}
