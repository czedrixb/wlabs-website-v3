import type { Metadata } from "next";
import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteT } from "@/lib/site/dictionary";
import { TOPICS } from "@/lib/site/content";
import { siteMetadata } from "@/lib/site/metadata";
import { ContactExperience } from "@/components/site/contact/ContactExperience";
import { Faq } from "@/components/site/modules/Faq";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const { contact } = siteT(locale);
  return siteMetadata({ locale, path: "/contact", title: contact.contactH1, description: contact.contactLead });
}

// WOS-334 wired the real inquiry form to src/app/api/contact/route.ts and
// the `inquiries` Payload collection; WOS-336 completes v3's inquiry screen
// (site/index.html:2693-3100): the `.on-navy` #contact surface the tuner
// card is designed against, the sp-tuner resonance finder with the form
// living inside its card, and the 8-question inquiry FAQ below.
export default async function ContactPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const s = siteT(locale);
  const { chrome, contact } = s;

  return (
    <section className="screen on-navy" id="contact">
      <div className="wrap page-head">
        <div className="row-between">
          <span className="eyebrow">{chrome.tabContact}</span>
        </div>
        <h1>{contact.contactH1}</h1>
        <p className="lead">{contact.contactLead}</p>
      </div>
      <ContactExperience locale={locale} tuner={s.tuner} contact={contact} topics={TOPICS} />
      <Faq locale={locale} s={s.faq} variant="inquiry" />
    </section>
  );
}
