type Props = {
  dark?: boolean;
  caption?: string;
  children?: React.ReactNode;
};

// ── calm field section ──────────────────────────────────────────────────
// WOS-349: the two-source interference engine that painted ripple rings
// into a <canvas> here was retired on Sir Joseph's feedback — the constant
// high-contrast motion tired visitors' eyes. The background is now pure
// CSS on the section itself (see site.css "field" module): the same navy
// gradient ground, with two soft light pools drifting on the section's
// ::before/::after. The component only provides the section shell and the
// content slot; there is nothing left to run on the client.

export function Field({ dark, caption, children }: Props) {
  return (
    <section className={dark ? "sp-field sp-field--dark" : "sp-field"}>
      <div className="sp-field-inner">
        {caption && <p className="sp-field-cap">{caption}</p>}
        {children}
      </div>
    </section>
  );
}
