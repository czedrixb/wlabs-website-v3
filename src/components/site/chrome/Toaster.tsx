"use client";

import { useEffect, useRef, useState } from "react";
import { onToast, type ToastPayload } from "@/lib/site/toastBus";

// WOS-336: v3's toast widget (site/index.html:3759-3762) — one toast at a
// time, bottom centre, above the mobile tab bar (.toast CSS was ported in
// WOS-314 and sat unused until now). Faithful behaviors: ✓/! icon by kind,
// re-showing retriggers the slide-in (drop .on, force reflow, re-add),
// auto-hide after ms (6500 default / 9000 on failure), manual × dismiss,
// and `.on-dark` inversion whenever the toast would sit on a dark surface —
// v3 checks `.header.is-dark` or the contact screen being active; here the
// contact page marks itself with #contact + .on-navy, so its presence is
// that same signal.
export function Toaster() {
  const elRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => onToast((t) => setToast({ ...t })), []);

  useEffect(() => {
    const el = elRef.current;
    if (!toast || !el) return;
    window.clearTimeout(timerRef.current);
    el.classList.toggle(
      "on-dark",
      Boolean(document.querySelector(".header.is-dark")) || Boolean(document.getElementById("contact")),
    );
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
    timerRef.current = window.setTimeout(() => el.classList.remove("on"), toast.ms ?? 6500);
    return () => window.clearTimeout(timerRef.current);
  }, [toast]);

  function dismiss() {
    window.clearTimeout(timerRef.current);
    elRef.current?.classList.remove("on");
  }

  return (
    <div ref={elRef} className={`toast${toast?.kind === "error" ? " err" : ""}`} role="status" aria-live="polite">
      <span className="ico" aria-hidden="true">
        {toast ? (toast.kind === "error" ? "!" : "✓") : ""}
      </span>
      <div className="body">
        {toast && (
          <>
            <b>{toast.title}</b>
            {toast.msg}
          </>
        )}
      </div>
      {/* v3 hardcodes this aria-label in English in both languages. */}
      <button className="x" type="button" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
