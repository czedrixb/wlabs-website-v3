"use client";

import { useEffect, type RefObject } from "react";

/**
 * The sliding highlight pill shared by every segmented control in the site
 * (Work/Company's `.seg-track` route tabs, the project/insights `.filters-
 * track` filter pills) — ported from site/index.html's `placePill()`.
 *
 * The source drives this with a page-wide MutationObserver watching
 * aria-selected/aria-pressed; in React the active item is already state
 * (or the current route), so `useTrackPill` just re-measures whenever that
 * value changes, plus on resize/font-load exactly as the source does.
 */
function placePill(track: HTMLElement | null, instant = false): void {
  if (!track) return;
  let pill = track.querySelector<HTMLSpanElement>(":scope>.track-pill");
  if (!pill) {
    pill = document.createElement("span");
    pill.className = "track-pill no-anim";
    pill.setAttribute("aria-hidden", "true");
    track.prepend(pill);
    instant = true;
  }

  const active = track.querySelector<HTMLElement>(
    ':scope>button[aria-selected="true"],:scope>button[aria-pressed="true"],:scope>a[aria-current="page"]',
  );
  if (!active || !track.offsetParent) {
    pill.style.setProperty("--on", "0");
    return;
  }

  if (instant) pill.classList.add("no-anim");
  const l = active.offsetLeft;
  const r = track.clientWidth - (active.offsetLeft + active.offsetWidth);
  const prev = parseFloat(pill.style.getPropertyValue("--l")) || 0;
  if (l !== prev) {
    pill.classList.toggle("to-right", l > prev);
    pill.classList.toggle("to-left", l < prev);
  }
  pill.style.setProperty("--l", `${l}px`);
  pill.style.setProperty("--r", `${r}px`);
  pill.style.setProperty("--on", "1");
  if (instant) {
    requestAnimationFrame(() => requestAnimationFrame(() => pill!.classList.remove("no-anim")));
  }
}

/** Wires one `.seg-track`/`.filters-track` element's pill to `activeKey`. */
export function useTrackPill(trackRef: RefObject<HTMLElement | null>, activeKey: string): void {
  useEffect(() => {
    placePill(trackRef.current, true);
    function onResize() {
      placePill(trackRef.current, true);
    }
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => placePill(trackRef.current, true));
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);
}
