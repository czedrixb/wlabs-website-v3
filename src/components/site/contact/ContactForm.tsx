"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { Topic } from "@/lib/site/content";

type Props = { locale: Locale; s: SiteStrings["contact"]; topics: Topic[] };

type FieldErrors = { name?: boolean; email?: boolean; topic?: boolean };
type Status = { kind: "ok" | "err"; text: string } | null;

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Lazy-loaded on first focus into the form, same as v3's own
// loadRecaptcha() (site/index.html:3483) — but the empty-key branch is now
// the *normal* path (every environment today has no key configured), not
// the only path the prototype ever exercised.
let recaptchaLoading: Promise<unknown> | null = null;
function loadRecaptcha(): Promise<unknown> {
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

// Ports v3's #contact-form (site/index.html:2713-2728) class-for-class
// (form form-2 / field req / ferr / check full / req-note full /
// form-status full / rc-note full) so src/styles/site.css's existing rules
// apply unchanged. Two deliberate differences from v3: no demoNote line
// (that line *was* the localStorage disclaimer this ticket removes), and
// no toast widget (the role="status" line below is the accessible
// equivalent; the toast ships with the sp-tuner follow-up).
export function ContactForm({ locale, s, topics }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [consented, setConsented] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const topic = String(fd.get("topic") ?? "");
    const emailOk = email !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const nextErrors: FieldErrors = {
      name: name === "",
      email: !emailOk,
      topic: topic === "",
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || !consented) {
      setStatus({ kind: "err", text: s.invalid });
      const firstBadField = nextErrors.name ? "name" : nextErrors.email ? "email" : "topic";
      (form.querySelector(`[name="${firstBadField}"]`) as HTMLElement | null)?.focus();
      return;
    }

    setSending(true);
    setStatus({ kind: "ok", text: s.sending });

    const token = await captchaToken();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setSending(false);
        return;
      }

      setStatus({ kind: "ok", text: s.sent.replace("{ref}", data.ref ?? "") });
      form.reset();
      setConsented(false);
      setErrors({});
    } catch {
      setStatus({ kind: "err", text: s.failed });
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      ref={formRef}
      className={`form form-2${sending ? " sending" : ""}`}
      onFocus={() => void loadRecaptcha()}
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
    >
      <p className="req-note full">
        <b>*</b> {s.reqNote}
      </p>

      {/* Honeypot — off-screen and out of tab order, not merely visually
          hidden; a real visitor never reaches or fills it. */}
      <div className="vh" aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={`field req${errors.name ? " err" : ""}`}>
        <label htmlFor="c-name">{s.fName}</label>
        <input id="c-name" name="name" autoComplete="name" required onInput={() => setErrors((e) => ({ ...e, name: false }))} />
        <span className="ferr">{s.errName}</span>
      </div>
      <div className="field">
        <label htmlFor="c-org">{s.fOrg}</label>
        <input id="c-org" name="org" autoComplete="organization" />
      </div>
      <div className={`field req${errors.email ? " err" : ""}`}>
        <label htmlFor="c-email">{s.fEmail}</label>
        <input
          id="c-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          onInput={() => setErrors((e) => ({ ...e, email: false }))}
        />
        <span className="ferr">{s.errEmail}</span>
      </div>
      <div className="field">
        <label htmlFor="c-phone">{s.fPhone}</label>
        <input id="c-phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className={`field full req${errors.topic ? " err" : ""}`}>
        <label htmlFor="c-topic">{s.fTopic}</label>
        <select id="c-topic" name="topic" required defaultValue="" onChange={() => setErrors((e) => ({ ...e, topic: false }))}>
          <option value="" disabled>
            {" "}
          </option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {locale === "en" ? t.label.en : t.label.ko}
            </option>
          ))}
        </select>
        <span className="ferr">{s.errTopic}</span>
      </div>
      <div className="field full">
        <label htmlFor="c-msg">{s.fMsg}</label>
        <textarea id="c-msg" name="message" rows={5} />
      </div>
      <label className="check full">
        <input
          id="c-privacy"
          type="checkbox"
          required
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
        />
        <span>{s.consent1}</span>
      </label>
      <label className="check full">
        <input id="c-marketing" name="marketing" type="checkbox" />
        <span>{s.consent2}</span>
      </label>
      <div className="full">
        <button className="btn btn-primary btn-full" type="submit" disabled={!consented || sending} title={consented ? "" : s.needConsent}>
          <span>{s.send}</span>
          <span className="arr" aria-hidden="true">
            ↗
          </span>
        </button>
      </div>
      {status && (
        <p className={`form-status full${status.kind === "ok" ? " ok" : " err"}`} role="status">
          {status.text}
        </p>
      )}
      <p className="rc-note full">
        {s.rcNote.lead}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">
          {s.rcNote.privacy}
        </a>
        {s.rcNote.mid}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener">
          {s.rcNote.terms}
        </a>
        {s.rcNote.tail}
      </p>
    </form>
  );
}
