import nodemailer from "nodemailer";

// Port of wsoftlabs-website-v2's server/utils/mailer.js (WOS-286) — the
// Gmail-backed mail helpers that project uses for its own /api/contact and
// /api/subscribe. Two load-bearing decisions carried over verbatim:
//
// 1. resolveMailConfig() never falls back the recipient to GMAIL_USER. A
//    misconfigured deploy must *skip* sending, not silently redirect every
//    inquiry into an inbox nobody is watching.
// 2. sendMailChecked() only counts a send as successful when Gmail's own
//    `accepted` list actually contains the intended recipient — resolving
//    to the wrong address, or no address, is a failure even if `sendMail`
//    itself didn't throw.
//
// Unlike the Nuxt original (which throws createError and 500s the request),
// resolveMailConfig here returns null on missing/invalid config — this repo's
// contact route treats mail as best-effort: a send failure must never flip
// the existing { ok, ref } success contract the two contact forms' e2e specs
// depend on.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MailConfig = {
  gmailUser: string;
  gmailAppPassword: string;
  recipient: string;
};

/**
 * Reads and validates the Gmail credentials + recipient from the
 * environment. Returns null (logging why) when unset or malformed, so an
 * unconfigured environment (local dev, CI, e2e by default) just skips
 * sending instead of failing the request.
 */
export function resolveMailConfig(): MailConfig | null {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim();

  if (!gmailUser || !gmailAppPassword || !recipient) {
    // All three unset is the normal path in every environment today (same
    // register as the contact route's own RECAPTCHA_SECRET comment) — not
    // logged as an error.
    return null;
  }

  if (!EMAIL_RE.test(recipient)) {
    console.error(`CONTACT_RECIPIENT_EMAIL is malformed: ${JSON.stringify(recipient)}`);
    return null;
  }

  return { gmailUser, gmailAppPassword, recipient };
}

export function createTransporter(config: MailConfig) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.gmailUser, pass: config.gmailAppPassword },
  });
}

/**
 * Sends the message and verifies Gmail actually accepted the intended
 * recipient before treating the send as successful. Logs the resolved SMTP
 * outcome either way, so logs show where a message actually went rather
 * than just "sent successfully".
 */
export async function sendMailChecked(
  transporter: ReturnType<typeof nodemailer.createTransport>,
  message: Parameters<ReturnType<typeof nodemailer.createTransport>["sendMail"]>[0],
): Promise<{ messageId: string; accepted: string[] }> {
  const info = await transporter.sendMail(message);

  const accepted = (info.accepted ?? []).map(String);
  const rejected = (info.rejected ?? []).map(String);

  console.log("Gmail send result:", {
    to: message.to,
    accepted,
    rejected,
    messageId: info.messageId,
    response: info.response,
  });

  if (rejected.length > 0 || !accepted.includes(String(message.to))) {
    throw new Error("Mail server did not accept the intended recipient");
  }

  return { messageId: info.messageId, accepted };
}
