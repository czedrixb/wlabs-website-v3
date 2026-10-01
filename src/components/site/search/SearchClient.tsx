"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { SearchIndexEntry, SearchKind } from "@/lib/site/searchIndex";

type Props = { locale: Locale; eyebrow: string; s: SiteStrings["search"]; index: SearchIndexEntry[] };

// WOS-336: the /search screen — v3's client-side search
// (site/index.html:3652-3686) plus the rotating "바로 가기" shortcut list
// (:5583-5727). Faithful mechanics:
//
// - 140ms debounce with the field's `.busy` spinner
// - AND-semantics scoring over BOTH languages' text (title hit 6 for
//   tokens ≥3 chars else 3, body hit 2, +2 title-prefix bonus), capped at
//   24 hits, grouped by kind in first-appearance order
// - <mark> highlighting of tokens ≥2 chars and a 140-char snippet centred
//   50 before the first match — built as React nodes, not innerHTML
// - ↑/↓ wrap the selection, Enter opens it (or the first hit), Escape
//   clears; the hint (<2 chars) and no-results states, the latter with a
//   [data-contact="general"] sheet trigger
// - the empty-query shortcuts rotate one row at a time from a 17-entry
//   pool: per-row clocks (7000 + n·2600 + jitter), at most two rows turn
//   per beat, a `.sp-sc-tick` progress bar per row, and everything holds
//   while the tab is hidden, a query is typed, or the pointer/focus is
//   inside the list.

// v3's SP_SHORTCUTS pool (index.html:5583-5601), hash-routes swapped for
// this repo's real ones (products deep-link to their own pages, as the
// pool — unlike the static seed rows — already did).
type ShortcutKind = "svc" | "prod" | "proj" | "page";
const SHORTCUTS: { kind: ShortcutKind; en: string; ko: string; href: string }[] = [
  { kind: "svc", en: "AI & Intelligent Automation", ko: "AI·지능형 자동화", href: "/work/services" },
  { kind: "svc", en: "Custom Software Development", ko: "맞춤 소프트웨어 개발", href: "/work/services" },
  { kind: "svc", en: "Data & Imaging Intelligence", ko: "데이터·이미징 인텔리전스", href: "/work/services" },
  { kind: "svc", en: "UI/UX & Product Design", ko: "UI/UX·제품 디자인", href: "/work/services" },
  { kind: "svc", en: "Modernization & Support", ko: "현대화·운영 지원", href: "/work/services" },
  { kind: "prod", en: "SkinArch", ko: "SkinArch", href: "/products/skinarch" },
  { kind: "prod", en: "BrainArch", ko: "BrainArch", href: "/products/brainarch" },
  { kind: "prod", en: "WIZ Assistant", ko: "WIZ Assistant", href: "/products/wiz" },
  { kind: "proj", en: "AI-Measuring & Analysis Skin Optics", ko: "AI 피부 광학 측정·분석", href: "/work/cases" },
  { kind: "proj", en: "YumTrack — AI-Aided Diet and Calorie Tracker", ko: "YumTrack — AI 식단·칼로리 트래커", href: "/work/cases" },
  { kind: "proj", en: "U Education LMS", ko: "U Education LMS", href: "/work/cases" },
  { kind: "proj", en: "Pagoda Talking Plus", ko: "Pagoda Talking Plus", href: "/work/cases" },
  { kind: "proj", en: "Lingrid — AI-Powered Multilingual Translator", ko: "Lingrid — AI 다국어 번역 플랫폼", href: "/work/cases" },
  { kind: "proj", en: "KindleUp — AI Encouragement Generation Platform", ko: "KindleUp — AI 응원 메시지 생성 플랫폼", href: "/work/cases" },
  { kind: "proj", en: "ToDon't", ko: "ToDon't", href: "/work/cases" },
  { kind: "proj", en: "AudioMint — AI-Generating Audio File", ko: "AudioMint — AI 오디오 파일 생성", href: "/work/cases" },
  { kind: "page", en: "Project Inquiry", ko: "프로젝트 문의", href: "/contact" },
];

// v3's static seed rows are these pool entries (index.html:2682-2686).
const SEED_ROWS = [2, 5, 7, 10, 16];

const ROW_COUNT = 5;
const MAX_HITS = 24;
const DEBOUNCE_MS = 140;

function strip(v: string): string {
  return v.toLowerCase().replace(/[“”"']/g, "").trim();
}

function tokens(v: string): string[] {
  return strip(v)
    .split(/[\s,·/]+/)
    .filter(Boolean);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Hit = { entry: SearchIndexEntry; score: number };

function score(entry: SearchIndexEntry, norm: string, toks: string[], locale: Locale): number {
  const title = strip(locale === "en" ? `${entry.title.en} ${entry.title.ko}` : `${entry.title.ko} ${entry.title.en}`);
  let sc = 0;
  for (const tk of toks) {
    if (title.includes(tk)) sc += tk.length >= 3 ? 6 : 3;
    else if (norm.includes(tk)) sc += 2;
    else return 0;
  }
  return sc + (title.startsWith(toks[0]) ? 2 : 0);
}

function snippet(text: string, toks: string[]): string {
  const i = text.toLowerCase().indexOf(toks[0]);
  if (i < 0 || text.length <= 140) return text.slice(0, 140) + (text.length > 140 ? "…" : "");
  const a = Math.max(0, i - 50);
  return (a > 0 ? "…" : "") + text.slice(a, a + 140) + (a + 140 < text.length ? "…" : "");
}

// Token highlighting as React nodes — v3 regex-replaces into innerHTML
// (index.html:3670); splitting on a capturing alternation keeps the same
// case-insensitive, all-occurrences behavior without raw HTML.
function Highlight({ text, toks }: { text: string; toks: string[] }) {
  const marked = toks.filter((t) => t.length >= 2);
  if (marked.length === 0) return <>{text}</>;
  const re = new RegExp(`(${marked.map(escapeRe).join("|")})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}

export function SearchClient({ locale, eyebrow, s, index }: Props) {
  const router = useRouter();
  const en = locale === "en";
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(-1);
  const hitRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const norms = useMemo(
    () => index.map((e) => `${e.title.en} ${e.title.ko} ${e.body.en} ${e.body.ko}`.toLowerCase()),
    [index],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApplied(query.trim());
      setSel(-1);
      setBusy(false);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const toks = useMemo(() => tokens(applied), [applied]);

  const hits = useMemo<Hit[]>(() => {
    if (applied.length < 2 || toks.length === 0) return [];
    return index
      .map((entry, i) => ({ entry, score: score(entry, norms[i], toks, locale) }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HITS);
  }, [applied, toks, index, norms, locale]);

  // Group in first-appearance order of the sorted hit list (v3's
  // `groups[kind] ??= []` insertion-order semantics), keeping each hit's
  // flat index for keyboard selection.
  const groups = useMemo(() => {
    const out: { kind: SearchKind; items: { hit: Hit; n: number }[] }[] = [];
    hits.forEach((hit, n) => {
      let g = out.find((x) => x.kind === hit.entry.kind);
      if (!g) {
        g = { kind: hit.entry.kind, items: [] };
        out.push(g);
      }
      g.items.push({ hit, n });
    });
    return out;
  }, [hits]);

  function hrefOf(entry: SearchIndexEntry): string {
    return withLocale(entry.href, locale) + (entry.hash ? `#${entry.hash}` : "");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (hits.length === 0) return;
      e.preventDefault();
      const next = (sel + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
      setSel(next);
      hitRefs.current[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      const target = hits[sel >= 0 ? sel : 0];
      if (target) {
        e.preventDefault();
        router.push(hrefOf(target.entry));
      }
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  const mode = applied === "" ? "shortcuts" : applied.length < 2 ? "hint" : hits.length === 0 ? "empty" : "hits";

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{eyebrow}</span>
        </div>
        <h1>{s.searchH1}</h1>
        <label className={`search-field${busy ? " busy" : ""}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="q"
            type="search"
            placeholder={s.placeholder}
            aria-label={s.searchH1}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setBusy(true); // v3 adds .busy on input, drops it in render()
            }}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
      <div className="wrap" style={{ paddingBottom: "var(--sec)" }}>
        <div id="search-results" className="results" hidden={mode === "shortcuts"} aria-live="polite">
          {mode === "hint" && <p className="hint">{s.hintMin}</p>}
          {mode === "empty" && (
            <div className="empty">
              <h2>{s.emptyH.replace("{q}", applied)}</h2>
              <p>{s.emptyP1}</p>
              <p>{s.emptyP2}</p>
              <div className="cta">
                <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact="general">
                  <span>{s.ctaAsk}</span>
                  <span className="arr" aria-hidden="true">
                    ↗
                  </span>
                </Link>
                <Link className="btn btn-ghost" href={withLocale("/work", locale)}>
                  {s.ctaBrowse}
                </Link>
              </div>
            </div>
          )}
          {mode === "hits" && (
            <>
              <p className="meta">
                {(hits.length === 1 ? s.metaCountOne : s.metaCount).replace("{n}", String(hits.length))} · {s.metaEnter}
              </p>
              {groups.map((group) => (
                <section className="group" key={group.kind}>
                  <h2>{s.kinds[group.kind]}</h2>
                  {group.items.map(({ hit, n }) => {
                    const title = en ? hit.entry.title.en : hit.entry.title.ko;
                    const body = en ? hit.entry.body.en : hit.entry.body.ko;
                    return (
                      <Link
                        className={`hit${n === sel ? " sel" : ""}`}
                        href={hrefOf(hit.entry)}
                        key={`${hit.entry.href}-${title}`}
                        ref={(el) => {
                          hitRefs.current[n] = el;
                        }}
                      >
                        <b>
                          <Highlight text={title} toks={toks} />
                        </b>
                        <p>
                          <Highlight text={snippet(body, toks)} toks={toks} />
                        </p>
                      </Link>
                    );
                  })}
                </section>
              ))}
            </>
          )}
        </div>
        <ShortcutList locale={locale} s={s} hidden={mode !== "shortcuts"} />
      </div>
    </>
  );
}

const CAP_KEY: Record<ShortcutKind, "inServices" | "inProducts" | "inProjects" | "interactiveCap"> = {
  svc: "inServices",
  prod: "inProducts",
  proj: "inProjects",
  page: "interactiveCap",
};

// The rotating shortcut list (v3 index.html:5602-5727). React renders each
// row from `shown` state; the swap animation and the progress bars stay
// imperative on refs — they're per-frame style writes the render loop
// shouldn't be re-running for.
function ShortcutList({ locale, s, hidden }: { locale: Locale; s: SiteStrings["search"]; hidden: boolean }) {
  const en = locale === "en";
  const [shown, setShown] = useState<number[]>(SEED_ROWS);
  const boxRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const shownRef = useRef(shown);
  const hiddenRef = useRef(hidden);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);
  useEffect(() => {
    hiddenRef.current = hidden;
  }, [hidden]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const period = (n: number) => 7000 + n * 2600 + Math.random() * 2600;
    const clocks = Array.from({ length: ROW_COUNT }, (_, n) => ({ t: Math.random() * period(n) * 0.5, d: period(n) }));
    let raf = 0;
    let last = performance.now();
    let seededDone = false;
    const swapTimers: number[] = [];

    // Seed: every row re-drawn once from the pool, no animation, clocks
    // spread out (v3 :5685-5691). Runs on the loop's first frame so the
    // random redraw happens after hydration, not during the effect body.
    function seed() {
      const seeded: number[] = [];
      for (let n = 0; n < ROW_COUNT; n++) {
        const pool = SHORTCUTS.map((_, i) => i).filter((i) => !seeded.includes(i));
        seeded.push(pool[(Math.random() * pool.length) | 0]);
      }
      setShown(seeded);
    }

    function held(): boolean {
      const box = boxRef.current;
      return (
        document.hidden ||
        hiddenRef.current ||
        !box ||
        box.matches(":hover") ||
        box.contains(document.activeElement)
      );
    }

    function swap(n: number) {
      const pool = SHORTCUTS.map((_, i) => i).filter((i) => !shownRef.current.includes(i));
      if (pool.length === 0) return;
      const next = pool[(Math.random() * pool.length) | 0];
      const row = rowRefs.current[n];
      const apply = () => setShown((prev) => prev.map((v, i) => (i === n ? next : v)));
      if (reduce.matches || !row) {
        apply();
        return;
      }
      row.classList.add("sp-sc-out");
      swapTimers.push(
        window.setTimeout(() => {
          apply();
          requestAnimationFrame(() => {
            row.classList.remove("sp-sc-out");
            row.classList.add("sp-sc-in");
            swapTimers.push(window.setTimeout(() => row.classList.remove("sp-sc-in"), 260));
          });
        }, 220),
      );
    }

    function frame(now: number) {
      if (!seededDone) {
        seededDone = true;
        seed();
      }
      const dt = Math.min(now - last, 250); // a backgrounded tab returns one huge delta; cap it
      last = now;
      if (!held()) {
        const ready: number[] = [];
        clocks.forEach((c, n) => {
          c.t += dt;
          if (c.t >= c.d) ready.push(n);
        });
        // At most two rows turn together — more reads as a full reload, so
        // the extras get pushed back a beat (v3 :5715-5718).
        ready.forEach((n, k) => {
          if (k < 2) {
            swap(n);
            clocks[n].t = 0;
            clocks[n].d = period(n);
          } else {
            clocks[n].t = clocks[n].d - 600 - Math.random() * 900;
          }
        });
      }
      clocks.forEach((c, n) => {
        const bar = barRefs.current[n];
        if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, c.t / c.d)).toFixed(3)})`;
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      swapTimers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div id="search-shortcuts" ref={boxRef} hidden={hidden}>
      <span className="cap" style={{ fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>
        {s.suggested}
      </span>
      <ul className="stub-list" style={{ marginTop: 8 }}>
        {shown.map((itemIndex, n) => {
          const item = SHORTCUTS[itemIndex];
          return (
            <li
              key={n}
              ref={(el) => {
                rowRefs.current[n] = el;
              }}
            >
              <Link href={withLocale(item.href, locale)}>
                {en ? item.en : item.ko}
                <span className="cap">{s[CAP_KEY[item.kind]]}</span>
              </Link>
              <i
                className="sp-sc-tick"
                aria-hidden="true"
                ref={(el) => {
                  barRefs.current[n] = el;
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
