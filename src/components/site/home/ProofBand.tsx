"use client";

import { useEffect, useRef } from "react";

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

export function ProofBand() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ranRef = useRef(false);

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
          <span className="eyebrow">검증 가능한 사실만</span>
        </div>
        <div className="proof-grid">
          <div className="proof-item">
            <b className="tnum" data-count="24">
              0
            </b>
            <span>수행한 고객사 프로젝트</span>
          </div>
          <div className="proof-item">
            <b className="tnum" data-count="2022" data-from="2000">
              2000
            </b>
            <span>년부터 중단 없이 이어온 프로젝트 수행</span>
          </div>
          <div className="proof-item">
            <b className="ok">
              <i aria-hidden="true">✓</i>
              <span style={{ font: "inherit", color: "inherit" }}>Verified</span>
            </b>
            <span>라이프사이언스 R&D 마켓플레이스 Science Exchange 인증 공급업체</span>
          </div>
          <div className="proof-item">
            <b className="ok">
              <i aria-hidden="true">✓</i>
              <span style={{ font: "inherit", color: "inherit" }}>Approved</span>
            </b>
            <span>글로벌 제약사 승인 공급업체</span>
          </div>
        </div>
        <div className="proof-foot cap">
          <span>헬스케어·라이프사이언스, 교육, 물류, 리테일·키오스크, 인쇄, 공공, 컨슈머 앱 전반.</span>
          <a href="https://www.scienceexchange.com" target="_blank" rel="noopener noreferrer">
            Science Exchange ↗
          </a>
        </div>
      </div>
    </div>
  );
}
