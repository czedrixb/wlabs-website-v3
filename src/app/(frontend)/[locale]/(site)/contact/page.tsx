import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { TOPICS } from "@/lib/site/content";
import { siteMetadata } from "@/lib/site/metadata";
import { ContactForm } from "@/components/site/contact/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { contact } = siteT(locale);
  return siteMetadata({ locale, path: "/contact", title: contact.contactH1, description: contact.contactLead });
}

// WOS-334: replaces the WOS-314 stub with the real inquiry form, wired to
// src/app/api/contact/route.ts and the `inquiries` Payload collection —
// the v3 prototype's `localStorage`-only stub (site/index.html:3481-3501,
// its own `demoNote` disclaimer) is gone. Form only — v3's sp-tuner
// resonance finder and #sheet-form slide-over are deferred to a follow-up
// ticket (see the WOS-334 plan); this also renders on the default cream
// surface rather than v3's `.on-navy` inquiry screen, which is designed
// around the tuner card sitting on it.
export default async function ContactPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { chrome, contact } = siteT(locale);

  return (
    <>
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabContact}</span>
        </div>
        <h1>{contact.contactH1}</h1>
        <p className="lead">{contact.contactLead}</p>
      </div>
      <div className="wrap" style={{ paddingBottom: "var(--s6)" }}>
        <ContactForm locale={locale} s={contact} topics={TOPICS} />
      </div>
    </>
  );
}
