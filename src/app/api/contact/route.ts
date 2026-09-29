import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "@/lib/getPayload";
import { TOPICS } from "@/lib/site/content";
import type { Inquiry } from "@/payload-types";

// WOS-334: replaces v3's inquiry-form `localStorage` stub
// (site/index.html:3481-3501) with a real, persisted submission. Called by
// ContactForm.tsx (src/components/site/contact/ContactForm.tsx).
export const dynamic = "force-dynamic";

const TOPIC_IDS = new Set(TOPICS.map((t) => t.id));
const MAX_LEN = { name: 200, org: 200, email: 254, phone: 40, message: 4000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-process only — resets on every deploy/cold start and is per-instance
// on Vercel (Fluid compute can route a burst across several warm
// instances), so this is a speed bump against casual spam, not a hard
// guarantee. A shared store (or Vercel's own firewall rules) is the real
// fix if spam actually materialises — same "be honest about the limit"
// register as payload.config.ts's pool.max comment.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(request: NextRequest): string {
  // Next doesn't expose a parsed client IP on NextRequest — read the
  // standard proxy header (Vercel and most reverse proxies set this; the
  // self-hosted deploy sits behind nginx per deploy.sh, same header).
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function refCode(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WL-${date}-${rand}`;
}

type CaptchaResult = {
  status: "ok" | "skipped" | "unavailable" | "error" | "low-score";
  score?: number;
};

// reCAPTCHA v3 only runs when RECAPTCHA_SECRET is configured — unset in
// every environment today (local dev, CI, e2e), so `skipped` is the normal
// path, not a degraded one. This is what keeps the contact-form e2e spec
// free of a live Google dependency (per the global testing policy).
async function verifyCaptcha(token: unknown): Promise<CaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return { status: "skipped" };
  if (typeof token !== "string" || !token) return { status: "unavailable" };

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    if (!data.success) return { status: "error" };
    const score = typeof data.score === "number" ? data.score : undefined;
    if (score !== undefined && score < 0.5) return { status: "low-score", score };
    return { status: "ok", score };
  } catch {
    return { status: "error" };
  }
}

function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= maxLen;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  // Honeypot: a field no human fills in (hidden off-screen by ContactForm's
  // CSS, not just visually hidden — see that component). A bot that fills
  // every field gets a fake success instead of a rejection, so it never
  // learns it was caught.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, ref: refCode() });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  const { name, org, email, phone, message, topic, locale, consentPrivacy, consentMarketing, captchaToken } = body;

  if (!isNonEmptyString(name, MAX_LEN.name)) {
    return NextResponse.json({ ok: false, error: "invalid-name" }, { status: 400 });
  }
  if (!isNonEmptyString(email, MAX_LEN.email) || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }
  if (typeof topic !== "string" || !TOPIC_IDS.has(topic)) {
    return NextResponse.json({ ok: false, error: "invalid-topic" }, { status: 400 });
  }
  if (consentPrivacy !== true) {
    return NextResponse.json({ ok: false, error: "consent-required" }, { status: 400 });
  }
  if (org !== undefined && !isNonEmptyString(org, MAX_LEN.org) && org !== "") {
    return NextResponse.json({ ok: false, error: "invalid-org" }, { status: 400 });
  }
  if (phone !== undefined && typeof phone === "string" && phone.length > MAX_LEN.phone) {
    return NextResponse.json({ ok: false, error: "invalid-phone" }, { status: 400 });
  }
  if (message !== undefined && typeof message === "string" && message.length > MAX_LEN.message) {
    return NextResponse.json({ ok: false, error: "invalid-message" }, { status: 400 });
  }
  if (locale !== "ko" && locale !== "en") {
    return NextResponse.json({ ok: false, error: "invalid-locale" }, { status: 400 });
  }

  const captcha = await verifyCaptcha(captchaToken);
  if (captcha.status === "low-score" || captcha.status === "error") {
    return NextResponse.json({ ok: false, error: "captcha-failed" }, { status: 400 });
  }

  const ref = refCode();

  try {
    const payload = await getPayload();
    await payload.create({
      collection: "inquiries",
      data: {
        ref,
        topic: topic as Inquiry["topic"],
        name: name.trim(),
        org: typeof org === "string" ? org.trim() : undefined,
        email: email.trim(),
        phone: typeof phone === "string" ? phone.trim() : undefined,
        message: typeof message === "string" ? message.trim() : undefined,
        consentPrivacy: true,
        consentMarketing: consentMarketing === true,
        locale: locale as Inquiry["locale"],
        source: "contact-form",
        captchaStatus: captcha.status,
        captchaScore: captcha.score,
        userAgent: request.headers.get("user-agent") ?? undefined,
        ip,
        status: "new",
      },
    });
  } catch (err) {
    console.error("Failed to save contact inquiry:", err);
    return NextResponse.json({ ok: false, error: "save-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ref });
}
