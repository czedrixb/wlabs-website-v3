"use client";

import { useEffect, useRef } from "react";

type Props = { tips: { term: string; tip: string }[] };

// WOS-336: v3's chip-glossary tooltip (site/index.html:3713-3724). One
// shared `.tipbox` bubble (CSS ported in WOS-314, unused until now) serves
// every `.chip[data-tip]` on the page via delegated pointer/focus events —
// chips opt in by rendering `data-tip="<term>"` + tabIndex={0} themselves
// (v3 text-matches chip contents at runtime; here the term is always passed
// explicitly, so Korean-labelled chips like the tuner's carry their English
// term key the same way the source's tuner markup does).
//
// Faithful behaviors: bubble above the chip, centred and clamped 8px from
// the viewport edges, flipping below (`.below`) when it would clip the top;
// position published as --tx/--ty and the arrow offset as --ax; shown on
// pointerover/focusin, hidden on pointerout/focusout/scroll/Escape with the
// 180ms exit delay; `aria-describedby="chip-tip"` on the active chip only.
//
// Imperative by design — hover positioning is measure-then-place on a
// singleton, exactly the work React state would only add latency to. The
// component renders the (hidden) bubble; everything else is delegation.
export function TipboxHost({ tips }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const termEl = termRef.current;
    const tipEl = tipRef.current;
    if (!box || !termEl || !tipEl) return;

    const tipByTerm = new Map(tips.map((t) => [t.term, t.tip]));
    let cur: HTMLElement | null = null;
    let hideTimer: number | undefined;

    function show(chip: HTMLElement) {
      const term = chip.dataset.tip ?? "";
      const tip = tipByTerm.get(term);
      if (!box || !termEl || !tipEl || !tip) return;
      window.clearTimeout(hideTimer);
      if (cur && cur !== chip) cur.removeAttribute("aria-describedby");
      cur = chip;
      termEl.textContent = term;
      tipEl.textContent = tip;
      box.hidden = false;
      chip.setAttribute("aria-describedby", "chip-tip");
      const r = chip.getBoundingClientRect();
      box.classList.remove("below");
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      let x = r.left + r.width / 2 - bw / 2;
      x = Math.max(8, Math.min(window.innerWidth - bw - 8, x));
      let y = r.top - bh - 10;
      if (y < 8) {
        y = r.bottom + 10;
        box.classList.add("below");
      }
      box.style.setProperty("--tx", `${x}px`);
      box.style.setProperty("--ty", `${y}px`);
      box.style.setProperty("--ax", `${r.left + r.width / 2 - x}px`);
      requestAnimationFrame(() => box.classList.add("on"));
    }

    function hide() {
      if (!box) return;
      cur?.removeAttribute("aria-describedby");
      cur = null;
      box.classList.remove("on");
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!cur) box.hidden = true;
      }, 180);
    }

    const chipOf = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element ? target.closest<HTMLElement>(".chip[data-tip]") : null;

    const onOver = (e: PointerEvent) => {
      const chip = chipOf(e.target);
      if (chip) show(chip);
    };
    const onOut = (e: PointerEvent) => {
      const chip = chipOf(e.target);
      if (chip && !(e.relatedTarget instanceof Node && chip.contains(e.relatedTarget))) hide();
    };
    const onFocusIn = (e: FocusEvent) => {
      const chip = chipOf(e.target);
      if (chip) show(chip);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (chipOf(e.target)) hide();
    };
    const onScroll = () => hide();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(hideTimer);
    };
  }, [tips]);

  return (
    <div ref={boxRef} className="tipbox" id="chip-tip" role="tooltip" hidden>
      <b ref={termRef} />
      <span ref={tipRef} />
    </div>
  );
}
