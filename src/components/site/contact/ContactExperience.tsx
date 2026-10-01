"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteStrings } from "@/lib/site/dictionary";
import type { Topic } from "@/lib/site/content";
import { SpTuner } from "./tuner/SpTuner";
import type { TunerPayload } from "./tuner/tunerData";
import { ContactForm } from "./ContactForm";

type Props = {
  locale: Locale;
  tuner: SiteStrings["tuner"];
  contact: SiteStrings["contact"];
  topics: Topic[];
};

// WOS-336: the contact page's interactive half — the sp-tuner resonance
// finder with the inquiry form living inside its card. v3 wires the two
// through globals (spTunerOnResult writes #c-topic/#c-msg imperatively,
// index.html:5351-5366); here the payload is ordinary lifted state and
// ContactForm applies it through guarded props — the same observable
// behavior (topic follows the tuner, the message carries the summary until
// the visitor types their own, the placeholder invites them to the dials
// until the tuning locks) without fighting React over the field values.
export function ContactExperience({ locale, tuner, contact, topics }: Props) {
  const [payload, setPayload] = useState<TunerPayload | null>(null);

  return (
    <SpTuner s={tuner} onResult={setPayload}>
      <ContactForm
        locale={locale}
        s={contact}
        topics={topics}
        id="contact-form"
        prefillTopic={payload?.topic ?? null}
        prefillMessage={payload?.summary ?? ""}
        messagePlaceholder={payload?.locked && payload.summary ? payload.summary : tuner.msgHint}
      />
    </SpTuner>
  );
}
