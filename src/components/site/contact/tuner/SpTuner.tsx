"use client";

import { useEffect, useRef } from "react";
import type { SiteStrings } from "@/lib/site/dictionary";
import {
  PROD_CARDS,
  PROJ_CARDS,
  SP_TUNER_AXES,
  SP_TUNER_PRODUCTS,
  SP_TUNER_SERVICES,
  SVC_CARDS,
  resolveTuner,
  type TunerPayload,
  type TunerState,
} from "./tunerData";
import { createTunerWave } from "./tunerWave";
import { flip } from "./tunerFlip";

type Props = {
  s: SiteStrings["tuner"];
  /** Fired whenever the tuning payload actually changes (JSON-stamp guarded, v3 :5197-5204). Null = nothing set. */
  onResult: (payload: TunerPayload | null) => void;
  /** The inquiry form, rendered inside the tuner card's .sp-tuner-form box (v3's groupInquiry, :5460-5478). */
  children: React.ReactNode;
};

// WOS-336: the sp-tuner "resonance finder" — v3's MOD:tuner
// (site/index.html:2702-2963 markup, :4841-5325 behavior). Three dials →
// a weighted score per service → a readout, a harmonic wave and a FLIP
// reorder of the three card grids, with the conclusion published to the
// host as a payload (topic/summary/…).
//
// The markup renders once from the descriptors in tunerData.ts and never
// re-renders — all the dynamics (dial glides, readout, wave, FLIP child
// reordering) run imperatively over refs in one mount effect, a direct
// port of the v3 module. That's deliberate: flip() reorders real DOM
// children, which React must not own, and the wave is a rAF loop. Strings
// come from the `s` prop instead of v3's hidden .sp-tuner-strings bag.
//
// `.on-light`: the whole card counts as one light surface for the header's
// contrast sampler, inner navy scope included (v3's groupInquiry adds the
// same class, :5464-5467).
export function SpTuner({ s, onResult, children }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element>(sel: string, r: ParentNode = root) => r.querySelector(sel) as T | null;
    const qa = <T extends Element>(sel: string, r: ParentNode = root) => [...r.querySelectorAll(sel)] as T[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ac = new AbortController();
    const { signal } = ac;

    const state: TunerState = { building: null, stage: null, pace: null };
    const svcGrid = q<HTMLElement>("#sp-tuner-svc-grid")!;
    const prodGrid = q<HTMLElement>("#sp-tuner-prod-grid")!;
    const projGrid = q<HTMLElement>("#sp-tuner-proj-grid")!;
    const scope = q<HTMLElement>("#sp-tuner-scope")!;
    const resetBtn = q<HTMLButtonElement>("#sp-tuner-reset")!;

    // Natural order = the render order of the descriptors, the same rows
    // that produced the markup (v3 captures it from the DOM before any
    // FLIP, :4963-4968 — here the descriptors ARE that source).
    const SVC_NATURAL = SVC_CARDS.map((c) => String(c.id));
    const PROD_NATURAL = PROD_CARDS.map((c) => c.id);
    const PROJ_NATURAL = PROJ_CARDS.map((c) => c.id);

    const wave = createTunerWave({
      svg: q<SVGSVGElement>("#sp-tuner-wave")!,
      main: q<SVGPathElement>("#sp-tuner-wave-main")!,
      ghost: q<SVGPathElement>("#sp-tuner-wave-ghost")!,
      nodes: q<SVGGElement>("#sp-tuner-wave-nodes")!,
      reduced,
    });

    const serviceName = (id: number) => s[SP_TUNER_SERVICES[id - 1].nameField];
    function productName(id: string): string {
      const p = SP_TUNER_PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      const n = s[p.nameField];
      return p.isCustom ? n : n + (p.ruo ? ` (${s.ruo})` : "");
    }

    // A range input jumps to a new value the instant it is set — right
    // while dragging, wrong when the value comes from a label tap or
    // Reset. Those glide; `step` is loosened for the duration (v3 :4986).
    type GlidingInput = HTMLInputElement & { _spGlide?: number };
    function glide(input: GlidingInput, to: number, after?: () => void) {
      const from = Number(input.value);
      if (reduced.matches || from === to) {
        input.value = String(to);
        after?.();
        return;
      }
      if (input._spGlide) cancelAnimationFrame(input._spGlide);
      const t0 = performance.now();
      const d = Math.min(460, 200 + Math.abs(to - from) * 95);
      input.step = "any";
      (function frame(now: number) {
        const p = Math.min(1, (now - t0) / d);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        input.value = String(from + (to - from) * e);
        if (p < 1) {
          input._spGlide = requestAnimationFrame(frame);
        } else {
          input._spGlide = 0;
          input.step = "1";
          input.value = String(to);
          after?.();
        }
      })(t0);
    }

    SP_TUNER_AXES.forEach((ax) => {
      const rail = q<HTMLElement>(`.sp-tuner-rail[data-sp-axis="${ax.id}"]`);
      if (!rail) return;
      const input = q<GlidingInput>("input", rail)!;
      const commit = (i: number) => {
        input.value = String(i);
        rail.dataset.touched = "true";
        state[ax.id] = ax.options[i];
        applyTuning(true);
      };
      input.addEventListener("input", () => {
        if (!input._spGlide) commit(Number(input.value));
      }, { signal });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          commit(Number(input.value));
        }
      }, { signal });
      qa<HTMLButtonElement>("[data-sp-set]", rail).forEach((b) =>
        b.addEventListener("click", () => {
          const to = Number(b.dataset.spSet);
          glide(input, to, () => commit(to));
          input.focus({ preventScroll: true });
        }, { signal }),
      );
    });

    function renderRailLabels() {
      SP_TUNER_AXES.forEach((ax) => {
        const rail = q<HTMLElement>(`.sp-tuner-rail[data-sp-axis="${ax.id}"]`);
        if (!rail) return;
        const input = q<HTMLInputElement>("input", rail)!;
        const i = Number(input.value);
        const cur = state[ax.id];
        const label = s.optionShorts[ax.options[i]] || s.optionLabels[ax.options[i]];
        input.setAttribute("aria-valuetext", cur ? label : `${s.unset} · ${label}`);
        q<HTMLElement>(".sp-tuner-val", rail)!.textContent = cur ? label : s.unset;
        qa<HTMLButtonElement>("[data-sp-set]", rail).forEach((b) =>
          b.setAttribute("aria-pressed", String(Number(b.dataset.spSet) === i)),
        );
      });
    }

    resetBtn.addEventListener("click", () => {
      // all three dials travel home together; the readout settles once
      // they have arrived rather than three times on the way
      let left = SP_TUNER_AXES.length;
      SP_TUNER_AXES.forEach((ax) => {
        const rail = q<HTMLElement>(`.sp-tuner-rail[data-sp-axis="${ax.id}"]`);
        if (!rail) {
          left--;
          return;
        }
        rail.dataset.touched = "false";
        state[ax.id] = null;
        glide(q<GlidingInput>("input", rail)!, ax.def, () => {
          if (!--left) applyTuning(true);
        });
      });
      if (!left) applyTuning(true);
    }, { signal });

    function buildSummary(r: ReturnType<typeof resolveTuner>): string {
      const bits = SP_TUNER_AXES.map((ax) => (state[ax.id] ? s.optionShorts[state[ax.id]!] : null)).filter(Boolean);
      const out: string[] = [];
      if (bits.length) out.push(bits.join(" · "));
      if (r.service) out.push(`${s.resonates}: ${serviceName(r.service)}`);
      if (r.step) out.push(`${s.stepK}: ${s.steps[r.step]}`);
      return out.join(" — ");
    }

    function buildPayload(r: ReturnType<typeof resolveTuner>): TunerPayload | null {
      if (!Object.values(state).some(Boolean)) return null;
      return {
        topic: r.service ? SP_TUNER_SERVICES[r.service - 1].topic : "general",
        service: r.service ? serviceName(r.service) : null,
        timeline: state.pace,
        scope: state.building,
        stage: state.stage,
        locked: r.locked,
        summary: buildSummary(r),
      };
    }

    let lastPayload = "";
    let lastKey = "";

    function applyTuning(userDriven: boolean) {
      renderRailLabels();
      const r = resolveTuner(state);
      const anySet = Object.values(state).some(Boolean);
      resetBtn.disabled = !anySet;

      // Readout
      q<HTMLElement>("#sp-tuner-ro-wait")!.hidden = Boolean(r.service);
      q<HTMLElement>("#sp-tuner-ro-service")!.hidden = !r.service;
      q<HTMLElement>("#sp-tuner-ro-product")!.hidden = !r.product;
      q<HTMLElement>("#sp-tuner-ro-step")!.hidden = !r.step;
      if (!r.service && anySet) q<HTMLElement>("#sp-tuner-ro-wait")!.hidden = false;
      if (r.service) {
        const svc = SP_TUNER_SERVICES[r.service - 1];
        const code = svc.code[0] + svc.code.slice(1).toLowerCase();
        const b = document.createElement("b");
        b.textContent = `0${svc.id} / ${code}`;
        q<HTMLElement>("#sp-tuner-ro-service-v")!.replaceChildren(b, document.createTextNode(` — ${serviceName(svc.id)}`));
      }
      if (r.product) {
        const v = q<HTMLElement>("#sp-tuner-ro-product-v")!;
        const b = document.createElement("b");
        b.textContent = productName(r.product);
        const nodes: Node[] = [b];
        if (r.also) {
          const sub = document.createElement("span");
          sub.className = "sp-tuner-ro-sub";
          sub.textContent = `· ${s.also} ${productName(r.also)}`;
          nodes.push(document.createTextNode(" "), sub);
        }
        v.replaceChildren(...nodes);
      }
      if (r.step) q<HTMLElement>("#sp-tuner-ro-step-v")!.textContent = s.steps[r.step];

      scope.classList.toggle("is-neutral", !r.service);
      const wasLocked = scope.classList.contains("is-locked");
      scope.classList.toggle("is-locked", r.locked);
      const key = [state.building, state.stage, state.pace].join("|");
      if (r.locked && key !== lastKey && userDriven && !reduced.matches) {
        scope.classList.remove("do-snap");
        void scope.offsetWidth;
        scope.classList.add("do-snap");
      }
      if (!r.locked && wasLocked) scope.classList.remove("do-snap");
      lastKey = key;

      // Wave targets
      wave.setTarget(state);

      // Page rearrangement: match first, everything else keeps its order.
      const flipOpts = { reduced: reduced.matches };
      const svcOrder = r.service ? [String(r.service), ...SVC_NATURAL.filter((id) => id !== String(r.service))] : SVC_NATURAL;
      flip(svcGrid, svcOrder, {
        ...flipOpts,
        beforeMeasureLast: () => {
          qa<HTMLElement>(".sp-tuner-svc", svcGrid).forEach((el) =>
            el.classList.toggle("is-match", Number(el.dataset.spId) === r.service),
          );
        },
      });

      const prodOrder = r.product
        ? [r.product, ...(r.also ? [r.also] : []), ...PROD_NATURAL.filter((id) => id !== r.product && id !== r.also)]
        : PROD_NATURAL;
      flip(prodGrid, prodOrder, {
        ...flipOpts,
        beforeMeasureLast: () => {
          prodGrid.classList.toggle("has-custom", r.product === "custom" || r.also === "custom");
          qa<HTMLElement>(".sp-tuner-prod", prodGrid).forEach((el) => {
            el.classList.toggle("is-match", el.dataset.spId === r.product);
            el.classList.toggle("is-also", el.dataset.spId === r.also);
          });
        },
      });
      // the secondary match says "also resonates", so its tag swaps copy
      qa<HTMLElement>(".sp-tuner-prod .sp-tuner-tag", prodGrid).forEach((tag) => {
        const also = tag.closest(".sp-tuner-prod")?.classList.contains("is-also");
        tag.textContent = also ? s.alsoTag : s.matchTag;
      });

      const projOrder = r.projects.length ? [...r.projects, ...PROJ_NATURAL.filter((id) => !r.projects.includes(id))] : PROJ_NATURAL;
      flip(projGrid, projOrder, {
        ...flipOpts,
        beforeMeasureLast: () => {
          qa<HTMLElement>(".sp-tuner-proj", projGrid).forEach((el) =>
            el.classList.toggle("is-match", r.projects.includes(el.dataset.spId ?? "")),
          );
        },
      });

      // Hand-off: the callback fires only when the payload really changed.
      const payload = buildPayload(r);
      const stamp = JSON.stringify(payload);
      if (stamp !== lastPayload) {
        lastPayload = stamp;
        try {
          onResultRef.current(payload);
        } catch {
          /* host callback errors must not break the tuner (v3 :5202) */
        }
      }
    }

    applyTuning(false);

    return () => {
      ac.abort();
      wave.destroy();
      qa<GlidingInput>("input.sp-tuner-dial").forEach((input) => {
        if (input._spGlide) cancelAnimationFrame(input._spGlide);
      });
    };
    // The strings slice is stable for the page's locale; the effect is a
    // one-time imperative init over the static markup below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wrap">
      <section className="sp-tuner on-light" aria-labelledby="sp-tuner-title" ref={rootRef}>
        <div className="sp-tuner-lead">
          <div>
            <p className="sp-tuner-eyebrow">{s.eyebrow}</p>
            <h2 className="sp-tuner-h" id="sp-tuner-title">
              {s.title}
            </h2>
          </div>
          <p className="sp-tuner-hint">{s.hint}</p>
        </div>

        <div className="sp-tuner-tuner">
          <div className="sp-tuner-scope is-neutral" id="sp-tuner-scope">
            <div className="sp-tuner-scope-grid" aria-hidden="true" />
            <div className="sp-tuner-snap-ring" aria-hidden="true" />
            <div className="sp-tuner-scope-head">
              <span>{s.scopeLabel}</span>
              <span className="sp-tuner-lock">{s.locked}</span>
            </div>
            <div className="sp-tuner-wave-wrap">
              <svg
                className="sp-tuner-wave"
                id="sp-tuner-wave"
                viewBox="0 0 800 240"
                preserveAspectRatio="none"
                role="img"
                aria-labelledby="sp-tuner-wave-desc"
                style={{ height: "clamp(180px,32vw,260px)" }}
              >
                <title id="sp-tuner-wave-desc">{s.waveDesc}</title>
                <defs>
                  <filter id="sp-tuner-glow" x="-10%" y="-60%" width="120%" height="220%">
                    <feGaussianBlur stdDeviation="4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <line className="sp-tuner-axis" x1="0" y1="120" x2="800" y2="120" />
                <path className="sp-tuner-ghost" id="sp-tuner-wave-ghost" d="" />
                <path className="sp-tuner-resolved" id="sp-tuner-wave-main" d="" />
                <g id="sp-tuner-wave-nodes" />
              </svg>
            </div>
            <div className="sp-tuner-readout" id="sp-tuner-readout" aria-live="polite" aria-atomic="true">
              <p className="sp-tuner-ro-wait" id="sp-tuner-ro-wait">
                {s.wait}
              </p>
              <p className="sp-tuner-ro-line" id="sp-tuner-ro-service" hidden>
                <span className="sp-tuner-ro-k">{s.resonates}</span>
                <span className="sp-tuner-ro-v" id="sp-tuner-ro-service-v" />
              </p>
              <p className="sp-tuner-ro-line" id="sp-tuner-ro-product" hidden>
                <span className="sp-tuner-ro-k">{s.prodMatch}</span>
                <span className="sp-tuner-ro-v" id="sp-tuner-ro-product-v" />
              </p>
              <p className="sp-tuner-ro-line" id="sp-tuner-ro-step" hidden>
                <span className="sp-tuner-ro-k">{s.stepK}</span>
                <span className="sp-tuner-ro-v" id="sp-tuner-ro-step-v" />
              </p>
            </div>
          </div>

          <form className="sp-tuner-dials" id="sp-tuner-dials" aria-labelledby="sp-tuner-dials-title" onSubmit={(e) => e.preventDefault()}>
            <h3 className="sp-tuner-sr" id="sp-tuner-dials-title">
              {s.dialsTitle}
            </h3>
            <div id="sp-tuner-rails">
              {SP_TUNER_AXES.map((ax) => (
                <div
                  key={ax.id}
                  className="sp-tuner-rail"
                  data-sp-axis={ax.id}
                  data-touched="false"
                  style={{ "--n": ax.options.length } as React.CSSProperties}
                >
                  <div className="sp-tuner-rail-head">
                    <label className="sp-tuner-q" id={`sp-tuner-q-${ax.id}`} htmlFor={`sp-tuner-dial-${ax.id}`}>
                      {s[ax.qField]}
                    </label>
                    <span className="sp-tuner-val" id={`sp-tuner-val-${ax.id}`} aria-hidden="true">
                      {s.unset}
                    </span>
                  </div>
                  <div className="sp-tuner-track" style={{ "--n": ax.options.length } as React.CSSProperties}>
                    <div className="sp-tuner-ticks" aria-hidden="true">
                      {ax.options.map((o) => (
                        <i key={o} />
                      ))}
                    </div>
                    <input
                      className="sp-tuner-dial"
                      type="range"
                      id={`sp-tuner-dial-${ax.id}`}
                      min={0}
                      max={ax.options.length - 1}
                      step={1}
                      defaultValue={ax.def}
                      aria-describedby={`sp-tuner-val-${ax.id}`}
                    />
                  </div>
                  <div className="sp-tuner-rail-labels" role="group" aria-labelledby={`sp-tuner-q-${ax.id}`}>
                    {ax.options.map((o, i) => (
                      <button key={o} type="button" data-sp-set={i} aria-pressed={i === ax.def}>
                        {s.optionLabels[o]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="sp-tuner-dials-foot">
              <p className="sp-tuner-cap">{s.cap}</p>
              <button className="sp-tuner-reset" type="button" id="sp-tuner-reset" disabled>
                <span aria-hidden="true">↺</span> <span>{s.reset}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="sp-tuner-results">
          <div className="sp-tuner-band">
            <p className="sp-tuner-eyebrow">{s.svcEyebrow}</p>
            <div className="sp-tuner-grid sp-tuner-svc-grid" id="sp-tuner-svc-grid">
              {SVC_CARDS.map((card) => (
                <article className="sp-tuner-card sp-tuner-svc" data-sp-id={card.id} key={card.id}>
                  <span className="sp-tuner-tag">{s.matchTag}</span>
                  <p className="sp-tuner-num">
                    <b>{card.number}</b>/ <span>{s[card.codeField]}</span>
                  </p>
                  <h3>{s[card.nameField]}</h3>
                  <p>{s[card.descField]}</p>
                  <div className="sp-tuner-tags">
                    {card.chips.map((chip) => (
                      <span className="chip" tabIndex={0} data-tip={chip.term} key={chip.term}>
                        {s[chip.labelField]}
                      </span>
                    ))}
                  </div>
                  <div className="sp-tuner-detail">
                    <div className="sp-tuner-related">
                      <span className="sp-tuner-rl">{s[card.relatedField]}</span>
                      <ul>
                        {card.related.map((rel) => (
                          <li key={rel.abbr}>
                            <i aria-hidden="true">{rel.abbr}</i>
                            <span>{s[rel.nameField]}</span>
                          </li>
                        ))}
                      </ul>
                      {card.noteField && <span className="sp-tuner-note">{s[card.noteField]}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="sp-tuner-band">
            <p className="sp-tuner-eyebrow">{s.prodEyebrow}</p>
            <div className="sp-tuner-grid sp-tuner-prod-grid" id="sp-tuner-prod-grid">
              {PROD_CARDS.map((card) => (
                <article
                  className={`sp-tuner-card sp-tuner-prod${card.isCustom ? " sp-tuner-custom" : ""}`}
                  data-sp-id={card.id}
                  key={card.id}
                >
                  <span className="sp-tuner-tag">{s.matchTag}</span>
                  <p className="sp-tuner-kind">
                    <span>{s[card.kindField]}</span>
                  </p>
                  <h3>{s[card.nameField]}</h3>
                  <p>{s[card.descField]}</p>
                  <div className="sp-tuner-price">
                    <span>{s[card.priceField]}</span>
                    {card.ruo && <span className="sp-tuner-ruo">{s.ruo}</span>}
                  </div>
                </article>
              ))}
            </div>
            <p className="sp-tuner-ruo-note">{s.ruoNote}</p>
          </div>

          <div className="sp-tuner-band">
            <p className="sp-tuner-eyebrow">{s.projEyebrow}</p>
            <div className="sp-tuner-grid sp-tuner-proj-grid" id="sp-tuner-proj-grid">
              {PROJ_CARDS.map((card) => (
                <article className="sp-tuner-card sp-tuner-proj" data-sp-id={card.id} key={card.id}>
                  <span className="sp-tuner-tag">{s.matchTag}</span>
                  <p className="sp-tuner-cat">{s[card.catField]}</p>
                  <h3>{s[card.nameField]}</h3>
                  <p>{s[card.descField]}</p>
                </article>
              ))}
            </div>
            <p className="sp-tuner-proj-note">{s.projNote}</p>
          </div>
        </div>

        {/* v3's groupInquiry moves the shell's form into this box at runtime
            (:5460-5478); here it's simply rendered in place. */}
        <div className="sp-tuner-form">
          <div className="sp-tuner-form-head">
            <h3>{s.formHeadH}</h3>
            <p>{s.formHeadP}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
