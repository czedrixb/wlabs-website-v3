"use client";

import { useEffect, useRef } from "react";

type Item = { year: string; heading: string; body: string };

type Props = { items: Item[] };

// Company → Story's `ol.timeline` — ported from site/index.html's small
// reveal-on-scroll IIFE ("Our story timeline: entries arrive as they enter
// the viewport; the spine fills to the viewport's midline"). Two effects,
// both driven off the DOM directly rather than React state (a scroll tick
// isn't worth a re-render, same convention as Hero.tsx):
//   - each `<li>` gets `.in` (and stays lit) via IntersectionObserver, the
//     CSS transition from opacity:0/translateY(24px) to visible;
//   - `--tl-fill` on the `<ol>` tracks how far down the reading position
//     has gone (monotonic — "the fill never retreats"), painting the
//     spine's filled segment.
export function StoryTimeline({ items }: Props) {
  const olRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;
    const liItems = [...ol.children] as HTMLLIElement[];

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) if (entry.isIntersecting) entry.target.classList.add("in");
        },
        { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
      );
      liItems.forEach((li) => io!.observe(li));
    } else {
      liItems.forEach((li) => li.classList.add("in"));
    }

    let ticking = false;
    let maxFill = 0;
    function fill() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!ol || ol.offsetParent === null) return;
        const rect = ol.getBoundingClientRect();
        const mid = window.innerHeight * 0.55;
        const f = Math.max(maxFill, Math.max(0, Math.min(1, (mid - rect.top) / rect.height)));
        maxFill = f;
        ol.style.setProperty("--tl-fill", `${(f * 100).toFixed(1)}%`);
        for (const li of liItems) {
          const liRect = li.getBoundingClientRect();
          if (liRect.top + 8 < mid) li.classList.add("lit");
        }
      });
    }

    window.addEventListener("scroll", fill, { passive: true });
    window.addEventListener("resize", fill);
    const interval = window.setInterval(fill, 500);
    fill();

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", fill);
      window.removeEventListener("resize", fill);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <ol className="timeline" ref={olRef}>
      {items.map((item) => (
        <li key={item.year}>
          <span className="tl-year">{item.year}</span>
          <div>
            <h3>{item.heading}</h3>
            <p>{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
