"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { Topic } from "@/lib/site/content";
import { loadRecaptcha, useInquirySubmit } from "./useInquirySubmit";

type Props = { locale: Locale; s: SiteStrings["sheet"]; topics: Topic[] };

// WOS-336: v3's #sheet contact slide-over (site/index.html:3147-3165 markup,
// :3749-3755 behavior) — the singleton dialog every `[data-contact]` trigger
// opens, with the trigger's value preselecting the topic. Mounted once in
// SiteChrome; triggers stay ordinary <Link href="/contact"> elements that
// carry data-contact, so with JS disabled they fall back to the contact page
// instead of doing nothing (v3 used <button>s with no fallback).
//
// Faithful behaviors: opener focus saved and restored, body scroll locked
// while open, topic <select> focused 50ms after opening, status hidden on
// every open, close on the × / backdrop click / global Escape / swipe-down
// >90px while the card is scrolled to its top. One deliberate addition: a
// minimal Tab-wrap focus trap — v3 declares aria-modal="true" without
// trapping, which is the one place this port doesn't reproduce a bug.
//
// The form is v3's slim variant (topic/email/message/consents — no name
// field) minus the demoNote line, plus the same honeypot as ContactForm;
// it shares that form's submit machinery via useInquirySubmit
// (source: "sheet-form", v3's own id for it).
export function ContactSheet({ locale, s, topics }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const touchY0 = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(topics[0]?.id ?? "general");
  const [consented, setConsented] = useState(false);
  const { sending, status, errors, setErrors, submit, reset } = useInquirySubmit({ locale, s, source: "sheet-form" });

  const topicIds = topics.map((t) => t.id).join("|");

  // Delegated trigger — any [data-contact] element anywhere on the page,
  // exactly v3's document-level listener (server components render plain
  // attributes, no wiring of their own).
  useEffect(() => {
    const ids = new Set(topicIds.split("|"));
    function onClick(e: MouseEvent) {
      if (!(e.target instanceof Element)) return;
      const trigger = e.target.closest<HTMLElement>("[data-contact]");
      if (!trigger) return;
      e.preventDefault();
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const wanted = trigger.dataset.contact;
      // Same guard as v3's #c-topic hand-off: an unknown topic value keeps
      // the previous selection instead of blanking the select.
      if (wanted && ids.has(wanted)) setTopic(wanted);
      reset();
      setOpen(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicIds]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => selectRef.current?.focus(), 50);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      openerRef.current?.focus?.();
    };
  }, [open]);

  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !cardRef.current) return;
    const focusables = [...cardRef.current.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea")].filter(
      (el) => el.tabIndex !== -1 && !el.hasAttribute("disabled"),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await submit(e.currentTarget, { consented })) {
      setConsented(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="sheet"
      id="sheet"
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      onClick={(e) => {
        if (e.target === rootRef.current) setOpen(false);
      }}
      onKeyDown={trapTab}
      onTouchStart={(e) => {
        touchY0.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        const y0 = touchY0.current;
        touchY0.current = null;
        if (y0 !== null && e.changedTouches[0].clientY - y0 > 90 && cardRef.current?.scrollTop === 0) {
          setOpen(false);
        }
      }}
    >
      <div ref={cardRef} className="sheet-card on-navy">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <div>
            <span className="eyebrow">{s.eyebrow}</span>
            <h2 id="sheet-title" style={{ marginTop: 10 }}>
              {s.h2}
            </h2>
          </div>
          <button className="sheet-close" type="button" aria-label={s.close} onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <form
          className={`form${sending ? " sending" : ""}`}
          id="sheet-form"
          noValidate
          onFocus={() => void loadRecaptcha()}
          onSubmit={(e) => void handleSubmit(e)}
        >
          {/* Honeypot — same convention as ContactForm's #c-website. */}
          <div className="vh" aria-hidden="true">
            <label htmlFor="s-website">Website</label>
            <input id="s-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field req">
            <label htmlFor="s-topic">{s.fTopic}</label>
            <select id="s-topic" name="topic" required ref={selectRef} value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {locale === "en" ? t.label.en : t.label.ko}
                </option>
              ))}
            </select>
          </div>
          <div className={`field req${errors.email ? " err" : ""}`}>
            <label htmlFor="s-email">{s.fEmail}</label>
            <input
              id="s-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              onInput={() => setErrors((prev) => ({ ...prev, email: false }))}
            />
            <span className="ferr">{s.errEmail}</span>
          </div>
          <div className="field">
            <label htmlFor="s-msg">{s.fMsgShort}</label>
            <textarea id="s-msg" name="message" rows={3} />
          </div>
          <label className="check">
            <input id="s-privacy" type="checkbox" required checked={consented} onChange={(e) => setConsented(e.target.checked)} />
            <span>{s.consentShort}</span>
          </label>
          <label className="check">
            <input id="s-marketing" name="marketing" type="checkbox" />
            <span>{s.consent2}</span>
          </label>
          <button className="btn btn-primary btn-full" type="submit" disabled={!consented || sending} title={consented ? "" : s.needConsent}>
            <span>{s.send}</span>
            <span className="arr" aria-hidden="true">
              ↗
            </span>
          </button>
          {status && (
            <p className={`form-status${status.kind === "ok" ? " ok" : " err"}`} role="status">
              {status.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
