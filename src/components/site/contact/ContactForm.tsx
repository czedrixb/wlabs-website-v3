"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { Topic } from "@/lib/site/content";
import { loadRecaptcha, useInquirySubmit } from "./useInquirySubmit";

type Props = {
  locale: Locale;
  s: SiteStrings["contact"];
  topics: Topic[];
  /** "contact-form" on the contact page — the #contact .sp-tuner host skin (site.css:1437-1500) keys off it. */
  id?: string;
  /** The tuner's topic hand-off — follows every tuning change, exactly v3's #c-topic write (unknown values keep the current selection). */
  prefillTopic?: string | null;
  /** The tuner's summary — owns the message box only until the visitor types their own text (v3's data-spTouched guard). */
  prefillMessage?: string;
  /** v3's messageHint(): the locked summary, or the "move the dials" invite. */
  messagePlaceholder?: string;
};

// Ports v3's #contact-form (site/index.html:2995-3009) class-for-class
// (form form-2 / field req / ferr / check full / req-note full /
// form-status full / rc-note full) so src/styles/site.css's existing rules
// apply unchanged. One deliberate difference from v3: no demoNote line
// (that line *was* the localStorage disclaimer WOS-334 removed). The
// validate/POST/status/toast machinery lives in useInquirySubmit (WOS-336),
// shared with the #sheet slide-over.
export function ContactForm({ locale, s, topics, id, prefillTopic = null, prefillMessage = "", messagePlaceholder }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [consented, setConsented] = useState(false);
  const { sending, status, errors, setErrors, submit } = useInquirySubmit({ locale, s, source: "contact-form" });

  // The two tuner-driven fields are controlled, with v3's exact ownership
  // rules, applied with the adjust-state-during-render pattern (a new
  // prefill value lands on the very render that carries it, no effect
  // round-trip).
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [messageTouched, setMessageTouched] = useState(false);
  const [prevPrefillTopic, setPrevPrefillTopic] = useState(prefillTopic);
  const [prevPrefillMessage, setPrevPrefillMessage] = useState(prefillMessage);
  if (prefillTopic !== prevPrefillTopic) {
    setPrevPrefillTopic(prefillTopic);
    if (prefillTopic && topics.some((t) => t.id === prefillTopic)) setTopic(prefillTopic);
  }
  if (prefillMessage !== prevPrefillMessage) {
    setPrevPrefillMessage(prefillMessage);
    if (!messageTouched) setMessage(prefillMessage);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await submit(e.currentTarget, { consented })) {
      setConsented(false);
    }
  }

  return (
    <form
      ref={formRef}
      id={id}
      className={`form form-2${sending ? " sending" : ""}`}
      onFocus={() => void loadRecaptcha()}
      onSubmit={(e) => void handleSubmit(e)}
      onReset={() => {
        // useInquirySubmit calls form.reset() on success — clear the
        // controlled fields along with the native ones.
        setTopic("");
        setMessage("");
        setMessageTouched(false);
      }}
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
        <select
          id="c-topic"
          name="topic"
          required
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setErrors((prev) => ({ ...prev, topic: false }));
          }}
        >
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
        <textarea
          id="c-msg"
          name="message"
          rows={5}
          value={message}
          placeholder={messagePlaceholder}
          onChange={(e) => {
            setMessage(e.target.value);
            // v3's data-spTouched: owned by the visitor while non-empty,
            // handed back to the tuner when they empty it (index.html:5363-5366).
            setMessageTouched(e.target.value.trim() !== "");
          }}
        />
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
