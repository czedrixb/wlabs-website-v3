import Link from "next/link";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";

type CtaButton = { label: string; topic: string };

type Props = {
  locale: Locale;
  eyebrow: string;
  h2: string;
  primary: CtaButton;
  ghost?: CtaButton;
  style?: CSSProperties;
  h2FontSize?: number;
};

// WOS-336: v3's `.cta-panel.on-navy` closing panel — Home's "다음 단계"
// (index.html:2424-2435) and Company/story's partnership panel (:2635-2640)
// are the same structure, so one component serves both. The watermark is
// the sprite's white W-mark (`<use href="#logo-icon-white">`, LogoSprite);
// `.row-between`/h2/.btns carry position:relative in v3 so they stack above
// it — the .wmark rule itself was ported in WOS-314 (site.css:242), unused
// until now. Buttons are [data-contact] sheet triggers with the /contact
// route as the no-JS fallback.
export function CtaPanel({ locale, eyebrow, h2, primary, ghost, style, h2FontSize }: Props) {
  return (
    <div className="cta-panel on-navy" style={style}>
      <svg className="wmark" viewBox="0 0 91 55" aria-hidden="true">
        <use href="#logo-icon-white" />
      </svg>
      <div className="row-between" style={{ position: "relative" }}>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h2 style={h2FontSize ? { fontSize: h2FontSize } : undefined}>{h2}</h2>
      <div className="btns">
        <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={primary.topic}>
          <span>{primary.label}</span>
          <span className="arr" aria-hidden="true">
            ↗
          </span>
        </Link>
        {ghost && (
          <Link className="btn btn-ghost" href={withLocale("/contact", locale)} data-contact={ghost.topic}>
            <span>{ghost.label}</span>
            <span className="arr" aria-hidden="true">
              →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
