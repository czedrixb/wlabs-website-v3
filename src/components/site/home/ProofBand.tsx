"use client";

import { useEffect, useRef } from "react";
import type { SiteStrings } from "@/lib/site/dictionary";

// Real content + counter animation ported from site/index.html's
// `.on-navy.proof` block, which lives inside Home's dark Field section
// (src/components/site/modules/Field.tsx). Once in view: the two numeric
// stats count up (ease-out cubic, same --micro=1400ms clock as every other
// reveal animation on the page) and the two "Verified"/"Approved" labels
// scramble-roll into place — both ported from the source's `count()`/
// `roll()` functions, unchanged.
const MICRO = 1400;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function animateCount(el: HTMLElement, to: number, from: number) {
  const t0 = performance.now();
  function step(now: number) {
    const k = Math.min(1, (now - t0) / MICRO);
    el.textContent = String(Math.round(from + (to - from) * ease(k)));
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateRoll(el: HTMLElement) {
  const final = el.textContent ?? "";
  if (!final.trim()) return;
  const chars = [...final];
  const n = chars.length;
  const t0 = performance.now();
  const isLatin = (c: string) => /[A-Za-z]/.test(c);
  function step(now: number) {
    const k = Math.min(1, (now - t0) / MICRO);
    el.textContent = chars
      .map((c, i) => {
        const settle = (i + 1) / n;
        if (k >= settle || !isLatin(c)) return c;
        const idx = Math.floor((k / settle) * 26 + i * 3) % 26;
        const l = A[idx];
        return c === c.toLowerCase() ? l.toLowerCase() : l;
      })
      .join("");
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

type Props = { s: SiteStrings["proof"] };

export function ProofBand({ s }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ranRef = useRef(false);
  // dictionary.ts's stat2 is "{year}년부터..." (ko) / "...since {year}" (en)
  // — a literal "{year}" marker, not real interpolation, so each language's
  // word order can put the animated <b data-count> counter on its own side
  // of the sentence (the WOS-314 counter-fragment fix, plan Step 5: v3's
  // own markup always put the number first, which only reads correctly in
  // Korean).
  const [stat2Before, stat2After] = s.stat2.split("{year}");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function run() {
      if (ranRef.current) return;
      ranRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => root!.classList.add("seen")));
      const counts = root!.querySelectorAll<HTMLElement>("[data-count]");
      if (reduce.matches) {
        counts.forEach((el) => {
          el.textContent = el.dataset.count ?? "";
        });
        return;
      }
      counts.forEach((el) =>
        animateCount(el, Number(el.dataset.count), Number(el.dataset.from ?? 0)),
      );
      root!.querySelectorAll<HTMLElement>(".ok span").forEach(animateRoll);
    }

    const io = new IntersectionObserver(
      (ents) => {
        if (ents.some((e) => e.isIntersecting)) run();
      },
      { threshold: 0.3 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="on-navy proof">
      <div className="wrap">
        <div className="row-between" style={{ marginBottom: "var(--s3)" }}>
          <span className="eyebrow">{s.eyebrow}</span>
        </div>
        <div className="proof-grid">
          <div className="proof-item">
            <b className="tnum" data-count="24">
              0
            </b>
            <span>{s.stat1}</span>
          </div>
          <div className="proof-item">
            <span className="stat2">
              {stat2Before}
              <b className="tnum" data-count="2022" data-from="2000">
                2000
              </b>
              {stat2After}
            </span>
          </div>
          <div className="proof-item">
            <b className="ok">
              <i aria-hidden="true">✓</i>
              <span style={{ font: "inherit", color: "inherit" }}>{s.stat3Badge}</span>
            </b>
            <span>{s.stat3}</span>
          </div>
          <div className="proof-item">
            <b className="ok">
              <i aria-hidden="true">✓</i>
              <span style={{ font: "inherit", color: "inherit" }}>{s.stat4Badge}</span>
            </b>
            <span>{s.stat4}</span>
          </div>
        </div>
        <div className="proof-foot cap">
          <span>{s.note}</span>
          <a href="https://www.scienceexchange.com" target="_blank" rel="noopener noreferrer">
            Science Exchange ↗
          </a>
        </div>
      </div>
    </div>
  );
}
