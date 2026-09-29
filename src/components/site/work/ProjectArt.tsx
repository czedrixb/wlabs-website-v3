import type { ArtKey } from "@/lib/site/content";

// The 9 inline-SVG project illustrations from v3's `ART` map
// (site/index.html:3506) — deliberately NOT part of content.generated.ts's
// extraction (see that script's header): these are presentation, built
// from the source's own T/T2/T3/INK palette consts, not portable content.
// Hand-ported here the same way HeroMark.tsx ported the hero's wave paths —
// each markup string is generated, deterministic output (no randomness in
// the source), so it's trusted, static innerHTML rather than a hand-built
// JSX tree.
//
// "layers" has no project pointing at it in the current PROJECTS table
// (only 8 of ART's 9 keys are ever used) — kept anyway, verbatim, in case a
// future project row picks it.
const T = "#034F5E";
const T2 = "#1A9BB1";
const T3 = "#D6EBEF";
const INK = "#2A2430";

type ArtEntry = { tint: string; svg: string; chip?: string };

const ART: Record<ArtKey, ArtEntry> = {
  cells: {
    tint: "#F1ECF3",
    svg: `<svg viewBox="0 0 240 150"><ellipse cx="120" cy="75" rx="104" ry="58" fill="#fff"/>${[...Array(14)]
      .map((_, i) => {
        const x = 50 + (i % 7) * 24 + (i > 6 ? 12 : 0);
        const y = i > 6 ? 92 : 58;
        return `<circle cx="${x}" cy="${y}" r="9" fill="${T3}"/><circle cx="${x}" cy="${y}" r="4" fill="${T}"/>`;
      })
      .join("")}</svg>`,
  },
  plate: {
    tint: "#EEF3EE",
    svg: `<svg viewBox="0 0 240 150"><circle cx="120" cy="75" r="56" fill="#fff"/><path d="M120 75V27A48 48 0 0 1 161 99Z" fill="#9AAE8C"/><path d="M120 75 161 99A48 48 0 0 1 78 98Z" fill="#D5B98F"/><path d="M120 75 78 98A48 48 0 0 1 120 27Z" fill="#EFE7D6"/></svg>`,
    chip: "Food / AI",
  },
  grid: {
    tint: "#EDF1F4",
    svg: `<svg viewBox="0 0 240 150"><rect x="40" y="26" width="160" height="98" rx="10" fill="#fff"/><rect x="40" y="26" width="160" height="22" rx="10" fill="${T}"/>${[...Array(12)]
      .map(
        (_, i) =>
          `<rect x="${52 + (i % 6) * 24}" y="${60 + Math.floor(i / 6) * 26}" width="16" height="16" rx="4" fill="${i % 5 === 0 ? T2 : T3}"/>`,
      )
      .join("")}</svg>`,
    chip: "LMS",
  },
  bubbles: {
    tint: "#F3EEE8",
    svg: `<svg viewBox="0 0 240 150"><rect x="36" y="34" width="110" height="40" rx="20" fill="#fff"/><rect x="94" y="84" width="110" height="40" rx="20" fill="${T}"/><text x="60" y="60" font-family="Raleway,sans-serif" font-size="15" fill="${INK}">Hello!</text><text x="118" y="110" font-family="Noto Sans KR,sans-serif" font-size="15" fill="#fff">안녕하세요!</text></svg>`,
  },
  translate: {
    tint: "#EDF1F4",
    svg: `<svg viewBox="0 0 240 150"><g transform="rotate(-6 80 75)"><rect x="46" y="42" width="66" height="66" rx="10" fill="#fff"/><text x="79" y="86" text-anchor="middle" font-family="Noto Sans KR,sans-serif" font-size="30" fill="${INK}">가</text></g><text x="120" y="82" text-anchor="middle" font-size="20" fill="${INK}">⇄</text><g transform="rotate(6 160 75)"><rect x="128" y="42" width="66" height="66" rx="10" fill="#fff"/><text x="161" y="86" text-anchor="middle" font-family="Quicksand,sans-serif" font-weight="700" font-size="30" fill="${T}">A</text></g></svg>`,
  },
  card: {
    tint: "#F1ECF3",
    svg: `<svg viewBox="0 0 240 150"><g transform="rotate(-5 120 75)"><rect x="52" y="40" width="136" height="76" rx="8" fill="${T3}"/><rect x="60" y="34" width="136" height="76" rx="8" fill="#fff"/><path d="M84 58l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${T2}"/><text x="82" y="94" font-family="Raleway,sans-serif" font-size="12" fill="${INK}">I support your efforts.</text></g></svg>`,
  },
  checklist: {
    tint: "#EEF3EE",
    svg: `<svg viewBox="0 0 240 150"><rect x="52" y="28" width="136" height="94" rx="10" fill="#fff"/>${[0, 1, 2]
      .map(
        (i) =>
          `<rect x="66" y="${44 + i * 26}" width="14" height="14" rx="4" fill="${i === 1 ? T : T3}"/><rect x="90" y="${49 + i * 26}" width="${[64, 84, 52][i]}" height="5" rx="2.5" fill="${i === 1 ? T3 : INK}" opacity="${i === 1 ? 1 : 0.6}"/>${
            i === 1 ? `<path d="M66 44l14 14M80 44l-14 14" stroke="${T}" stroke-width="1.5"/>` : ""
          }`,
      )
      .join("")}</svg>`,
  },
  wave: {
    tint: "#F1ECF3",
    svg: `<svg viewBox="0 0 240 150">${[14, 28, 46, 33, 59, 41, 64, 29, 48, 60, 35, 46, 24, 12]
      .map((v, i) => `<rect x="${58 + i * 9}" y="${75 - v / 2}" width="5" height="${v}" rx="2.5" fill="${T2}"/>`)
      .join("")}</svg>`,
  },
  layers: {
    tint: "#F3EEE8",
    svg: `<svg viewBox="0 0 240 150"><g transform="translate(120 78)"><path d="M-80 20 0-20 80 20 0 60Z" fill="${T3}"/><path d="M-80 0 0-40 80 0 0 40Z" fill="#fff" stroke="${T2}"/><path d="M-80-20 0-60 80-20 0 20Z" fill="${T}" opacity=".85"/></g></svg>`,
  },
};

type Props = { art: ArtKey };

// Renders the whole `.pvis` block (source: `artFor()` + the template's
// `<div class="pvis" style="--tint:${a.tint}" ...>`), so callers (project
// cards, the project detail page) just drop this in — no per-caller
// style/chip wiring.
export function ProjectArt({ art }: Props) {
  const entry = ART[art];
  const chipHtml = entry.chip ? `<span class="chiplet">${entry.chip}</span>` : "";
  return (
    <div
      className="pvis"
      style={{ ["--tint" as never]: entry.tint }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: entry.svg + chipHtml }}
    />
  );
}
