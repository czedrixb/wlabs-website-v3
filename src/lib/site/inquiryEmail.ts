import { TOPICS } from "./content";

// HTML email body for a contact-route submission, ported from
// wsoftlabs-website-v2's server/api/contact.post.js template (WOS-286) —
// same gradient header / field-grid cards / message box / reply CTA /
// footer — adapted to this repo's payload shape:
//   - `name` is optional (sheet-form has no name field by design), so its
//     card only renders when present, the same conditional pattern the
//     original template uses for its optional `company`/`subject` fields.
//   - every interpolated value is escaped — the original interpolated raw
//     form input into the HTML unescaped.
//   - `topic` renders the human label (submitter's locale) looked up from
//     TOPICS, not the raw id.
//   - adds a meta row for ref / source / locale / marketing consent, which
//     this repo tracks and the Nuxt original didn't have.

export type InquiryEmailInput = {
  ref: string;
  source: "contact-form" | "sheet-form";
  name?: string;
  org?: string;
  email: string;
  phone?: string;
  topic: string;
  message?: string;
  locale: "ko" | "en";
  consentMarketing: boolean;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function topicLabel(topicId: string, locale: "ko" | "en"): string {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return esc(topicId);
  return esc(locale === "en" ? topic.label.en : topic.label.ko);
}

function field(label: string, value: string, fullWidth = false): string {
  return `
        <div class="field${fullWidth ? " full-width" : ""}">
          <div class="field-label">${esc(label)}</div>
          <div class="field-value">${value}</div>
        </div>`;
}

export function buildInquiryEmail(input: InquiryEmailInput): { subject: string; html: string } {
  const who = input.name?.trim() || input.email;
  const topic = topicLabel(input.topic, input.locale);

  const subject = `[${topic}] ${who} — ${input.ref}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Contact Form Submission</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .wrapper {
      max-width: 620px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #2376E9 0%, #02C7D0 100%);
      padding: 36px 40px 28px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.3px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 14px;
      color: rgba(255,255,255,0.85);
    }
    .body {
      padding: 36px 40px;
    }
    .greeting {
      font-size: 16px;
      color: #0f172a;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .field {
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px 16px;
      border-left: 3px solid #2376E9;
      margin-bottom: 5px;
    }
    .field.full-width {
      grid-column: 1 / -1;
    }
    .field-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 500;
      word-break: break-word;
    }
    .message-box {
      background: #f8fafc;
      border-radius: 10px;
      padding: 18px 20px;
      border-left: 3px solid #02C7D0;
      margin-top: 4px;
    }
    .message-box .field-label {
      color: #94a3b8;
    }
    .message-box .field-value {
      line-height: 1.65;
      white-space: pre-line;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 28px 0;
    }
    .cta {
      text-align: center;
      margin-top: 20px;
    }
    .cta a {
      display: inline-block;
      background: linear-gradient(135deg, #2376E9, #02C7D0);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .footer {
      background: #0a1628;
      padding: 24px 40px;
      text-align: center;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    @media (max-width: 480px) {
      .field-grid { grid-template-columns: 1fr; }
      .field.full-width { grid-column: 1; }
      .body, .header, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Contact Form Submission</h1>
      <p>You have received a new message from the W Labs website</p>
    </div>

    <div class="body">
      <p class="greeting">Hello, here's what <strong>${esc(who)}</strong> sent you:</p>

      <div class="field-grid">
        ${input.name ? field("Name", esc(input.name)) : ""}
        ${field("Email", esc(input.email))}
        ${input.org ? field("Organization", esc(input.org)) : ""}
        ${input.phone ? field("Phone", esc(input.phone)) : ""}
        ${field("Topic", topic, true)}
      </div>

      <div class="message-box">
        <div class="field-label">Message</div>
        <div class="field-value">${input.message ? esc(input.message) : "<em>(no message)</em>"}</div>
      </div>

      <div class="divider"></div>

      <div class="field-grid">
        ${field("Reference", esc(input.ref))}
        ${field("Form", input.source === "sheet-form" ? "Site-wide sheet" : "Contact page")}
        ${field("Locale", input.locale.toUpperCase())}
        ${field("Marketing consent", input.consentMarketing ? "Yes" : "No")}
      </div>

      <div class="cta">
        <a href="mailto:${esc(input.email)}">Reply to ${esc(who)}</a>
      </div>
    </div>

    <div class="footer">
      <p>This email was sent from the contact form at <a href="https://wsoft.space" style="color:#2376E9;text-decoration:none;">wsoft.space</a></p>
      <p style="margin-top: 6px;">© ${new Date().getFullYear()} W Labs. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
