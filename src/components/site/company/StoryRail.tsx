"use client";

import { useEffect, useRef } from "react";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { RailEntryType } from "@/lib/site/content";

export type ResolvedRailEntry = {
  id: string;
  type: RailEntryType;
  t: number;
  total?: number;
  datetime: string;
  dateLabel: string;
  circa: boolean;
  title: string;
  meta?: string;
  para: string;
  enote?: string;
  enoteRuo?: boolean;
  breakLine?: { named: number; undisclosed: number };
  link?: { href: string; label: string };
};

type Props = { s: SiteStrings["rail"]; entries: ResolvedRailEntry[] };

// The axis constants (v3 index.html:4521-4522): 2022-01..2026-12, one range
// step = one month; "today" is the log's compile date, 2026-09.
const T0 = 2022;
const MONTHS = 59;
const T1 = T0 + MONTHS / 12;
const TODAY = 2026 + 8 / 12;
const PAD = 8;
const MAXOCC = 180;

const FILTERS: { id: string; labelField: "fAll" | "fCompany" | "fServices" | "fProducts" | "fProjects" | "fProof" }[] = [
  { id: "all", labelField: "fAll" },
  { id: "milestone", labelField: "fCompany" },
  { id: "service", labelField: "fServices" },
  { id: "product", labelField: "fProducts" },
  { id: "project", labelField: "fProjects" },
  { id: "proof", labelField: "fProof" },
];

const CHIP_FIELD: Record<RailEntryType, "chipMilestone" | "chipService" | "chipProduct" | "chipProject" | "chipProof"> = {
  milestone: "chipMilestone",
  service: "chipService",
  product: "chipProduct",
  project: "chipProject",
  proof: "chipProof",
};

// WOS-336: the company "reading log" rail — v3's MOD:rail
// (site/index.html:2526-2616 markup, :4485-4834 behavior). A native range
// input laid invisibly over a runtime-drawn SVG axis; scroll and rail are
// two views of one decimal-year `pos`, synced both ways behind a
// `programmatic` latch. Filters collapse entries, dim their axis ticks and
// rebuild the cumulative step trace; the two "honest counter" tiles read
// the rail position (named projects count up as the reader passes them,
// the confirmed 24 total only appears once the 2026 proof entry that
// states it has been passed).
//
// Like SpTuner, the markup renders once from props and the whole behavior
// is a verbatim imperative port in one mount effect — the module draws SVG
// geometry, tweens numbers and mutates entry heights per frame, none of
// which React state should re-render for.
export function StoryRail({ s, entries }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T | null;
    const $$ = <T extends Element>(sel: string) => [...root.querySelectorAll(sel)] as T[];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const RM = () => reduce.matches;
    const ac = new AbortController();
    const { signal } = ac;
    root.classList.add("is-live"); // the rail is a JS-only enhancement

    // The log as data — read straight off the DOM so markup and script
    // cannot drift apart (v3 :4517-4520). DOM order = newest first.
    type Entry = { el: HTMLElement; type: string; t: number; d: string; tick?: SVGLineElement };
    const ENTRIES: Entry[] = $$<HTMLElement>(".sp-rail-entry").map((el) => ({
      el,
      type: el.dataset.spType ?? "",
      t: Number(el.dataset.spT),
      d: el.querySelector("time")?.textContent?.trim() ?? "",
    }));
    const totalEl = $<HTMLElement>("[data-sp-total]");
    const TOTAL = totalEl ? Number(totalEl.dataset.spTotal) : 0;
    const TOTAL_T = totalEl ? Number(totalEl.dataset.spT) : T1;
    const NAMED = ENTRIES.filter((e) => e.type === "project").length;

    let filter = "all";
    const visible = (e: Entry) => filter === "all" || e.type === filter;
    const pills = $$<HTMLButtonElement>("[data-sp-filter]");

    // Sticky stack: how much of the viewport top the host chrome owns —
    // derived by hit-testing, no host selector (v3 :4559-4587).
    const band = $<HTMLElement>(".sp-rail-band")!;
    let hostOcc = 0;
    let bandH = 0;
    function measureHostOcclusion(): number {
      const rr = root!.getBoundingClientRect();
      let x = Math.round(rr.width > 8 ? rr.left + rr.width / 2 : window.innerWidth / 2);
      x = Math.max(1, Math.min(window.innerWidth - 1, x));
      let best = 0;
      for (const y of [2, 8, 16, 26, 38, 52, 68, 86, 106, 128, 152, 176]) {
        let stack: Element[] = [];
        try {
          stack = document.elementsFromPoint(x, y);
        } catch {
          /* older engines throw on out-of-viewport points */
        }
        for (const el of stack) {
          if (el === root || root!.contains(el)) break; // our own content is on top here
          const p = getComputedStyle(el).position;
          if (p !== "fixed" && p !== "sticky") continue;
          const r = el.getBoundingClientRect();
          if (r.top <= 1 && r.bottom > y - 2 && r.bottom <= MAXOCC) {
            if (r.bottom > best) best = Math.ceil(r.bottom);
            break;
          }
        }
      }
      return Math.min(MAXOCC, Math.max(0, best));
    }
    function measureStack() {
      const occ = measureHostOcclusion();
      if (occ !== hostOcc) {
        hostOcc = occ;
        root!.style.setProperty("--sp-rail-top", `${occ}px`);
      }
      const h = Math.round(band.getBoundingClientRect().height);
      if (h > 0 && h !== bandH) bandH = h;
      root!.style.setProperty("--sp-rail-off", `${hostOcc + bandH}px`);
    }
    const stackOffset = () => hostOcc + bandH;

    // Scrubber geometry — measured live, never cached from init (v3 :4603).
    const scrub = $<HTMLElement>(".sp-rail-scrub")!;
    const svg = $<SVGSVGElement>("#sp-rail-axis")!;
    const range = $<HTMLInputElement>("#sp-rail-range")!;
    const gTicks = $<SVGGElement>("#sp-rail-g-ticks")!;
    const gYears = $<SVGGElement>("#sp-rail-g-years")!;
    const gToday = $<SVGGElement>("#sp-rail-g-today")!;
    const ghost = $<SVGPathElement>("#sp-rail-ghost")!;
    const trace = $<SVGPathElement>("#sp-rail-trace")!;
    const clipRect = $<SVGRectElement>("#sp-rail-clip-rect")!;
    const handle = $<SVGCircleElement>("#sp-rail-handle")!;
    const ring = $<SVGCircleElement>("#sp-rail-handle-ring")!;
    const axisLine = $<SVGPathElement>("#sp-rail-axis-line")!;
    let W = 0;
    let H = 0;
    const xOf = (t: number) => PAD + ((t - T0) / (T1 - T0)) * (W - 2 * PAD);
    const yBase = () => H - 22;
    const yTop = () => 14;
    const mk = (n: string, a: Record<string, string | number>) => {
      const e = document.createElementNS("http://www.w3.org/2000/svg", n);
      for (const k in a) e.setAttribute(k, String(a[k]));
      return e;
    };

    function layout() {
      const r = scrub.getBoundingClientRect();
      W = Math.max(120, r.width);
      H = Math.max(40, r.height);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      axisLine.setAttribute("d", `M${PAD} ${yBase()}H${W - PAD}`);
      gYears.replaceChildren();
      for (let y = 2022; y <= 2026; y++) {
        const x = xOf(y);
        gYears.append(
          mk("line", { x1: x, x2: x, y1: yBase() - 4, y2: yBase() + 4, class: "sp-rail-ytick" }),
          Object.assign(mk("text", { x: x + 4, y: H - 6, class: "sp-rail-ylabel" }), { textContent: String(y) }),
        );
      }
      const xt = xOf(TODAY);
      gToday.replaceChildren(mk("line", { x1: xt, x2: xt, y1: yTop() - 6, y2: yBase(), class: "sp-rail-today-line" }));
      const tl = mk("text", { x: xt, y: yTop() - 8, class: "sp-rail-today-label", "text-anchor": W - xt < 40 ? "end" : "middle" });
      tl.textContent = s.todayLabel;
      gToday.append(tl);
      drawTicks();
      buildTrace();
      renderPos();
    }

    // one tick per entry, dimmed when its type is filtered out
    function drawTicks() {
      gTicks.replaceChildren();
      ENTRIES.forEach((e) => {
        const x = xOf(e.t);
        e.tick = mk("line", {
          x1: x,
          x2: x,
          y1: yBase() - 10,
          y2: yBase() - 1,
          class: `sp-rail-tick${visible(e) ? "" : " is-off"}${e.t <= pos ? " is-passed" : ""}`,
        }) as SVGLineElement;
        gTicks.append(e.tick);
      });
    }
    // cumulative signal: one step up per visible entry, oldest → newest
    let stepsAsc: number[] = [];
    function buildTrace() {
      stepsAsc = ENTRIES.filter(visible)
        .map((e) => e.t)
        .sort((a, b) => a - b);
      const n = stepsAsc.length;
      const yb = yBase();
      const yt = yTop();
      const dy = n ? (yb - yt) / n : 0;
      let d = `M${xOf(T0)} ${yb}`;
      let y = yb;
      stepsAsc.forEach((t) => {
        d += `H${xOf(t).toFixed(1)}`;
        y -= dy;
        d += `V${y.toFixed(1)}`;
      });
      d += `H${xOf(T1)}`;
      ghost.setAttribute("d", d);
      trace.setAttribute("d", d);
    }
    const yAt = (t: number) => {
      const n = stepsAsc.length;
      const yb = yBase();
      const yt = yTop();
      if (!n) return yb;
      let k = 0;
      for (const st of stepsAsc) {
        if (st <= t) k++;
        else break;
      }
      return yb - ((yb - yt) / n) * k;
    };

    // Position state: pos = target (decimal year); cur = drawn value.
    let pos = TODAY;
    let cur = TODAY;
    let raf = 0;
    let programmatic = false;
    let inView = true;
    function setPos(t: number, o?: { scroll?: boolean; snap?: boolean }) {
      o = o || {};
      pos = Math.min(T1, Math.max(T0, t));
      range.value = String(Math.round((pos - T0) * 12));
      updateRangeText();
      if (o.scroll !== false) scrollToDate(pos);
      ENTRIES.forEach((e) => {
        if (e.tick) e.tick.classList.toggle("is-passed", e.t <= pos);
      });
      updateCounters();
      if (o.snap || RM()) {
        cur = pos;
        renderPos();
      } else {
        kick();
      }
    }
    function kick() {
      if (!raf && !document.hidden && inView) raf = requestAnimationFrame(step);
    }
    function step() {
      raf = 0;
      const d = pos - cur;
      if (Math.abs(d) < 0.002) {
        cur = pos;
        renderPos();
        return;
      }
      cur += d * 0.18;
      renderPos();
      kick();
    }
    function renderPos() {
      const x = xOf(cur);
      const y = yAt(cur);
      clipRect.setAttribute("width", String(Math.max(0, x)));
      handle.setAttribute("cx", String(x));
      handle.setAttribute("cy", String(y));
      ring.setAttribute("cx", String(x));
      ring.setAttribute("cy", String(y));
    }

    const fmt = (t: number) => {
      const y = Math.floor(t + 1e-6);
      const m = Math.min(12, Math.max(1, Math.round((t - y) * 12) + 1));
      return `${y}-${String(m).padStart(2, "0")}`;
    };
    // readout: the snapped entry's own date, so a "c." entry stays "c."
    const label = (t: number) => {
      const e = entryAt(t);
      return e && Math.abs(e.t - t) < 1 / 24 ? e.d : fmt(t);
    };
    function updateRangeText() {
      range.setAttribute("aria-valuetext", label(pos));
      const rd = $<HTMLElement>("#sp-rail-reading");
      if (rd) rd.textContent = label(pos);
    }
    // the entry at a date: newest visible entry at/before pos, else the oldest visible
    function entryAt(t: number): Entry | null {
      const vis = ENTRIES.filter(visible);
      if (!vis.length) return null;
      return vis.find((e) => e.t <= t + 1e-6) ?? vis[vis.length - 1];
    }
    let scrollTm: number | undefined;
    function scrollToDate(t: number) {
      const e = entryAt(t);
      if (!e || !e.el.offsetParent) return;
      programmatic = true;
      const top = e.el.getBoundingClientRect().top + window.scrollY - stackOffset() - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: RM() ? "auto" : "smooth" });
      window.clearTimeout(scrollTm);
      scrollTm = window.setTimeout(() => {
        programmatic = false;
      }, RM() ? 60 : 900);
    }

    // rail → scroll: the invisible range supplies drag, touch and the
    // arrow keys; Home/End are wired so they land on the ends of the log.
    range.addEventListener("input", () => setPos(T0 + Number(range.value) / 12), { signal });
    range.addEventListener("keydown", (ev) => {
      if (ev.key === "Home") {
        ev.preventDefault();
        setPos(T0);
      }
      if (ev.key === "End") {
        ev.preventDefault();
        setPos(TODAY);
      }
    }, { signal });

    // scroll → rail (rAF-throttled)
    let sRaf = 0;
    window.addEventListener("scroll", () => {
      if (sRaf || programmatic || !inView) return;
      sRaf = requestAnimationFrame(() => {
        sRaf = 0;
        if (!programmatic) syncFromScroll();
      });
    }, { passive: true, signal });
    function syncFromScroll() {
      if (!root!.offsetParent) return;
      const line = stackOffset() + 40;
      const nodes = ENTRIES.filter((e) => visible(e) && e.el.offsetParent);
      if (!nodes.length) return;
      let pick: Entry | null = null;
      for (const e of nodes) {
        if (e.el.getBoundingClientRect().bottom > line) {
          pick = e;
          break;
        }
      }
      if (!pick) pick = nodes[nodes.length - 1];
      // at the very bottom of the page, land on the oldest entry
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) pick = nodes[nodes.length - 1];
      if (Math.abs(pick.t - pos) > 1e-6) setPos(pick.t, { scroll: false });
    }

    // Honest counters: named projects count up as the reader passes them;
    // the 24 total only appears once the entry confirming it is passed.
    // (v3 also composes #sp-rail-c-undisclosed / #sp-rail-c-yearlabel
    // strings, but those elements don't exist in its markup — dead code,
    // not ported; see the WOS-336 skip rationale.)
    const numNamed = $<HTMLElement>("#sp-rail-c-named");
    const numYear = $<HTMLElement>("#sp-rail-c-year");
    const bNamed = $<HTMLElement>("#sp-rail-b-named");
    function updateCounters() {
      const named = ENTRIES.filter((e) => e.type === "project" && e.t <= pos).length;
      const done = pos >= TOTAL_T - 1e-6;
      const year = Math.max(T0, Math.floor(pos + 1e-6));
      tween(numNamed, done ? TOTAL : named);
      tween(numYear, year);
      if (bNamed) bNamed.textContent = String(NAMED);
    }
    type TweenEl = HTMLElement & { _spRailRaf?: number };
    function tween(el: HTMLElement | null, target: number) {
      if (!el) return;
      const t = el as TweenEl;
      const from = Number(el.textContent) || 0;
      if (from === target) return;
      if (RM() || document.hidden || !inView) {
        el.textContent = String(target);
        return;
      }
      if (t._spRailRaf) cancelAnimationFrame(t._spRailRaf);
      const t0 = performance.now();
      const dur = 380;
      const run = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(from + (target - from) * e));
        if (p < 1) t._spRailRaf = requestAnimationFrame(run);
      };
      t._spRailRaf = requestAnimationFrame(run);
    }

    // Filtering: hiding a type collapses its entries and dims their ticks;
    // the trace is rebuilt so the step count matches what's on screen.
    function setFilter(f: string, instant?: boolean) {
      filter = f;
      pills.forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.spFilter === f)));
      ENTRIES.forEach((e) => (visible(e) ? expand(e.el, instant) : collapse(e.el, instant)));
      updateStatus();
      drawTicks();
      buildTrace();
      setPos(pos, { scroll: false, snap: instant });
    }
    pills.forEach((p) => p.addEventListener("click", () => setFilter(p.dataset.spFilter ?? "all"), { signal }));

    function collapse(el: HTMLElement, instant?: boolean) {
      if (el.hidden) return;
      if (instant || RM()) {
        el.hidden = true;
        return;
      }
      const h = el.getBoundingClientRect().height;
      el.style.height = `${h}px`;
      el.style.opacity = "1";
      el.style.transition = "none";
      requestAnimationFrame(() => {
        el.style.transition = "height .32s cubic-bezier(.2,.7,.2,1),opacity .22s,padding .32s";
        el.classList.add("is-collapsing");
        el.style.height = "0px";
        el.style.opacity = "0";
        const done = () => {
          el.removeEventListener("transitionend", done);
          if (el.style.height === "0px") {
            el.hidden = true;
            el.classList.remove("is-collapsing");
            el.style.cssText = "";
          }
        };
        el.addEventListener("transitionend", done);
        window.setTimeout(done, 420);
      });
    }
    function expand(el: HTMLElement, instant?: boolean) {
      if (!el.hidden && !el.classList.contains("is-collapsing")) return;
      el.hidden = false;
      el.classList.remove("is-collapsing");
      if (instant || RM()) {
        el.style.cssText = "";
        return;
      }
      el.style.transition = "none";
      el.style.height = "auto";
      const h = el.getBoundingClientRect().height;
      el.style.height = "0px";
      el.style.opacity = "0";
      el.classList.add("is-collapsing");
      requestAnimationFrame(() => {
        el.style.transition = "height .32s cubic-bezier(.2,.7,.2,1),opacity .28s .08s,padding .32s";
        el.classList.remove("is-collapsing");
        el.style.height = `${h}px`;
        el.style.opacity = "1";
        const done = () => {
          el.removeEventListener("transitionend", done);
          el.style.cssText = "";
        };
        el.addEventListener("transitionend", done);
        window.setTimeout(done, 420);
      });
    }
    function updateStatus() {
      const st = $<HTMLElement>("#sp-rail-status");
      if (st) st.textContent = s.status.replace("{n}", String(ENTRIES.filter(visible).length));
    }

    // per-filter entry counts, appended rather than written into the
    // markup so they cannot fall out of step with the log
    pills.forEach((p) => {
      if (p.querySelector(".sp-rail-pcount")) return;
      const f = p.dataset.spFilter;
      const n = f === "all" ? ENTRIES.length : ENTRIES.filter((e) => e.type === f).length;
      const b = document.createElement("span");
      b.className = "sp-rail-pcount";
      b.setAttribute("aria-hidden", "true");
      b.textContent = String(n);
      p.append(b);
    });

    // init + observers
    measureStack();
    layout();
    setFilter("all", true);
    setPos(TODAY, { scroll: false, snap: true });

    const roScrub = new ResizeObserver(() => layout());
    roScrub.observe(scrub);
    const roBand = new ResizeObserver(() => measureStack());
    roBand.observe(band);
    // the band's own height changes at these breakpoints
    const mqs = [window.matchMedia("(min-width:744px)"), window.matchMedia("(min-width:1200px)")];
    const onMq = () => {
      measureStack();
      layout();
    };
    mqs.forEach((mq) => mq.addEventListener("change", onMq));
    const onReduce = () => renderPos();
    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        kick();
      }
    }, { signal });
    const io = new IntersectionObserver(
      (es) => {
        inView = es.some((e) => e.isIntersecting);
        if (!inView) {
          cancelAnimationFrame(raf);
          raf = 0;
        } else {
          kick();
          measureStack();
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(root);

    return () => {
      ac.abort();
      roScrub.disconnect();
      roBand.disconnect();
      io.disconnect();
      mqs.forEach((mq) => mq.removeEventListener("change", onMq));
      reduce.removeEventListener("change", onReduce);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sRaf);
      window.clearTimeout(scrollTm);
    };
    // One-time imperative init over the static markup below; the strings
    // slice and entries are stable for the page's locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sp-rail" ref={rootRef}>
      <div className="sp-rail-band">
        <div className="sp-rail-rail" role="region" aria-label={s.region}>
          <div className="sp-rail-head">
            <span>{s.reading}</span>
            <b className="sp-rail-read" id="sp-rail-reading">
              2026-09
            </b>
            <span>{s.span}</span>
          </div>
          <div className="sp-rail-note">{s.todayNote}</div>
          <div className="sp-rail-scrub">
            <input id="sp-rail-range" type="range" min={0} max={59} step={1} defaultValue={56} aria-label={s.axisLabel} />
            <svg id="sp-rail-axis" aria-hidden="true" focusable="false">
              <defs>
                <clipPath id="sp-rail-clip">
                  <rect id="sp-rail-clip-rect" x="0" y="0" width="0" height="200" />
                </clipPath>
              </defs>
              <path id="sp-rail-axis-line" className="sp-rail-axis-line" d="M0 0" />
              <g id="sp-rail-g-years" />
              <g id="sp-rail-g-ticks" />
              <path id="sp-rail-ghost" className="sp-rail-ghost" d="M0 0" />
              <path id="sp-rail-trace" className="sp-rail-trace" d="M0 0" clipPath="url(#sp-rail-clip)" />
              <g id="sp-rail-g-today" />
              <circle id="sp-rail-handle-ring" className="sp-rail-ring" r="11" cx="0" cy="0" />
              <circle id="sp-rail-handle" className="sp-rail-handle" r="6" cx="0" cy="0" />
            </svg>
          </div>
        </div>
        <nav className="sp-rail-filters" aria-label={s.filterLabel}>
          {/* no whitespace between pills — inline-block gap control, v3 :2556 */}
          {FILTERS.map((f, i) => (
            <button key={f.id} type="button" className="sp-rail-pill" data-sp-filter={f.id} aria-pressed={i === 0}>
              <span>{s[f.labelField]}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sp-rail-counters" aria-live="off">
        <div className="sp-rail-tile">
          <span className="sp-rail-eyebrow">{s.cntProjectsE}</span>
          <span className="sp-rail-big" id="sp-rail-c-named">
            24
          </span>
          <span className="sp-rail-sub">{s.cntProjectsS}</span>
        </div>
        <div className="sp-rail-tile">
          <span className="sp-rail-eyebrow">{s.cntYearE}</span>
          <span className="sp-rail-big" id="sp-rail-c-year">
            2026
          </span>
          <span className="sp-rail-sub">{s.cntYearS}</span>
        </div>
      </div>

      <aside className="sp-rail-rule" aria-labelledby="sp-rail-rule-h">
        <h3 id="sp-rail-rule-h">{s.ruleH}</h3>
        <ul>
          <li>{s.rule1}</li>
          <li>{s.rule2}</li>
          <li>{s.rule3}</li>
        </ul>
      </aside>

      <p className="sp-rail-status" id="sp-rail-status" role="status" aria-live="polite">
        {s.status.replace("{n}", String(entries.length))}
      </p>

      <ol className="sp-rail-log" aria-label={s.logLabel}>
        {entries.map((e) => (
          <li
            key={e.id}
            className="sp-rail-entry"
            id={`sp-rail-e-${e.id}`}
            data-sp-type={e.type}
            data-sp-t={e.t}
            {...(e.total !== undefined ? { "data-sp-total": e.total } : {})}
          >
            <div className="sp-rail-date">
              <time dateTime={e.datetime} className={e.circa ? "sp-rail-circa" : undefined}>
                {e.dateLabel}
              </time>
              <span className={`sp-rail-chip is-${e.type}`}>{s[CHIP_FIELD[e.type]]}</span>
            </div>
            <div>
              <h3 className="sp-rail-title">{e.title}</h3>
              {e.meta && <p className="sp-rail-meta">{e.meta}</p>}
              <p className="sp-rail-para">{e.para}</p>
              {e.breakLine && (
                <p className="sp-rail-break">
                  <b id="sp-rail-b-named">{e.breakLine.named}</b> <span>{s.namedOnLog}</span> · <b>+{e.breakLine.undisclosed}</b>{" "}
                  <span>{s.undisclosedShort}</span>
                </p>
              )}
              {e.enote && <p className={`sp-rail-enote${e.enoteRuo ? " is-ruo" : ""}`}>{e.enote}</p>}
              {e.link && (
                <p>
                  <a className="sp-rail-link" href={e.link.href} target="_blank" rel="noopener">
                    {e.link.label}
                  </a>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
