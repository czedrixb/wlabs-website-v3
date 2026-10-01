"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { showToast } from "@/lib/site/toastBus";

// WOS-336: the submit machinery both inquiry forms share — extracted from
// ContactForm (WOS-334) so the #sheet slide-over doesn't fork it. Ports
// v3's generic [data-form] handler (site/index.html:3771-3782): validate →
// status line + toast on invalid → reCAPTCHA token → POST → status + toast
// on failure (9s) / success, reset on success, and (contact-form only)
// scroll the status line into view. `source` is v3's own discriminator —
// it stores the submitting form's id ("contact-form" / "sheet-form") — and
// here also decides whether `name` is required: the sheet form has no name
// field by design.

export type InquirySource = "contact-form" | "sheet-form";

export type InquiryStrings = {
  sending: string;
  sent: string; // carries "{ref}"
  failed: string;
  invalid: string;
  toastOkT: string;
  toastOk: string; // carries "{ref}"
  toastInvalidT: string;
  toastFailT: string;
};

export type InquiryFieldErrors = { name?: boolean; email?: boolean; topic?: boolean };
export type InquiryStatus = { kind: "ok" | "err"; text: string } | null;

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Lazy-loaded on first focus into a form, same as v3's own loadRecaptcha()
// (site/index.html:3765) — but the empty-key branch is now the *normal*
// path (every environment today has no key configured), not the only path
// the prototype ever exercised.
let recaptchaLoading: Promise<unknown> | null = null;
export function loadRecaptcha(): Promise<unknown> {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve(null);
  const w = window as unknown as { grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> } };
  if (w.grecaptcha) return Promise.resolve(w.grecaptcha);
  if (recaptchaLoading) return recaptchaLoading;
  recaptchaLoading = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve(w.grecaptcha ?? null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
    setTimeout(() => resolve(w.grecaptcha ?? null), 6000);
  });
  return recaptchaLoading;
}

async function captchaToken(): Promise<string | null> {
  const g = (await loadRecaptcha()) as
    | { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> }
    | null;
  if (!g || !RECAPTCHA_SITE_KEY) return null;
  try {
    await new Promise<void>((resolve) => g.ready(resolve));
    return await g.execute(RECAPTCHA_SITE_KEY, { action: "inquiry" });
  } catch {
    return null;
  }
}

export function useInquirySubmit({ locale, s, source }: { locale: Locale; s: InquiryStrings; source: InquirySource }) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<InquiryStatus>(null);
  const [errors, setErrors] = useState<InquiryFieldErrors>({});

  /** Validate + POST the form. Resolves true on a saved inquiry. */
  async function submit(form: HTMLFormElement, opts: { consented: boolean }): Promise<boolean> {
    const fd = new FormData(form);

    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const topic = String(fd.get("topic") ?? "");
    const emailOk = email !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const nextErrors: InquiryFieldErrors = {
      name: source === "contact-form" && name === "",
      email: !emailOk,
      topic: topic === "",
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !opts.consented) {
      setStatus({ kind: "err", text: s.invalid });
      showToast({ kind: "error", title: s.toastInvalidT, msg: s.invalid });
      const firstBadField = nextErrors.name ? "name" : nextErrors.email ? "email" : "topic";
      (form.querySelector(`[name="${firstBadField}"]`) as HTMLElement | null)?.focus();
      return false;
    }

    setSending(true);
    setStatus({ kind: "ok", text: s.sending });

    const token = await captchaToken();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          name,
          org: String(fd.get("org") ?? "").trim(),
          email,
          phone: String(fd.get("phone") ?? "").trim(),
          topic,
          message: String(fd.get("message") ?? "").trim(),
          consentPrivacy: true,
          consentMarketing: fd.get("marketing") === "on",
          locale,
          captchaToken: token,
          // Honeypot — left empty by a human, filled by naive bots.
          website: String(fd.get("website") ?? ""),
        }),
      });
      const data = (await res.json()) as { ok: boolean; ref?: string };

      if (!res.ok || !data.ok) {
        setStatus({ kind: "err", text: s.failed });
        showToast({ kind: "error", title: s.toastFailT, msg: s.failed, ms: 9000 });
        return false;
      }

      const ref = data.ref ?? "";
      setStatus({ kind: "ok", text: s.sent.replace("{ref}", ref) });
      showToast({ kind: "success", title: s.toastOkT, msg: s.toastOk.replace("{ref}", ref) });
      form.reset();
      setErrors({});
      if (source === "contact-form") {
        // The status line renders on the next paint — v3 scrolls it into
        // view synchronously (index.html:3782); wait one frame instead.
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        requestAnimationFrame(() => {
          form.querySelector(".form-status")?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
        });
      }
      return true;
    } catch {
      setStatus({ kind: "err", text: s.failed });
      showToast({ kind: "error", title: s.toastFailT, msg: s.failed, ms: 9000 });
      return false;
    } finally {
      setSending(false);
    }
  }

  /** Clear status + field errors — the sheet does this on every open (v3 hides [data-status] there). */
  function reset() {
    setStatus(null);
    setErrors({});
  }

  return { sending, status, errors, setErrors, submit, reset };
}
