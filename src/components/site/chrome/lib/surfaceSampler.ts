/**
 * Luminance-decision helpers shared by Header (desktop) and Masthead
 * (mobile): "what colour is actually painting under the logo" so the mark
 * can flip light/dark to stay legible, regardless of which section is
 * scrolled behind it. Ported from site/index.html's two near-duplicate
 * implementations (desktop header's `check()`, mobile masthead's
 * `mobileLogo() > read()`) into one shared function — the algorithm is
 * identical, only the element being probed differs.
 */

const RGBA_RE = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g;

function pickLuminance(value: string): number | null {
  RGBA_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RGBA_RE.exec(value))) {
    const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (alpha >= 0.5) {
      const r = Number(m[1]);
      const g = Number(m[2]);
      const b = Number(m[3]);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
  }
  return null;
}

function elementLuminance(el: Element): number | null {
  const cs = getComputedStyle(el);
  const bg = pickLuminance(cs.backgroundColor);
  if (bg !== null) return bg;
  const image = cs.backgroundImage;
  return image && image !== "none" ? pickLuminance(image) : null;
}

// Sections that paint via canvas or a gradient (the field, the service
// bands) fall straight through the luminance probe — no readable
// background-color — so they self-declare instead.
function declaredDark(el: Element): boolean | null {
  const c = el.classList;
  if (c.contains("on-navy") || c.contains("sp-field--dark") || c.contains("sp-bands")) return true;
  if (c.contains("on-light")) return false;
  return null;
}

/**
 * Sample the element stack at each x in `xs` (same y), ignoring anything
 * inside `ignore` (the bar doing the asking). Returns whether the majority
 * of samples that resolved to *anything* were dark, or null if none did.
 *
 * `onLightShortCircuit` is the desktop check()'s extra rule (WOS-336,
 * site/index.html:3640): when the TOPMOST element under a point sits
 * inside an `.on-light` ancestor, that sample counts as light without
 * walking the rest of the stack — so a card that declares itself one
 * light surface (the contact tuner) never reads as dark through its inner
 * navy panels.
 */
export function isDarkAt(xs: number[], y: number, ignore: Element, onLightShortCircuit = false): boolean | null {
  let dark = 0;
  let total = 0;
  for (const x of xs) {
    const stack = document.elementsFromPoint(x, y).filter((el) => !ignore.contains(el));
    if (stack.length === 0) continue;
    if (onLightShortCircuit && stack[0].closest(".on-light")) {
      total++;
      continue;
    }
    for (const el of stack) {
      const declared = declaredDark(el);
      if (declared !== null) {
        total++;
        if (declared) dark++;
        break;
      }
      const luminance = elementLuminance(el);
      if (luminance !== null) {
        total++;
        if (luminance < 140) dark++;
        break;
      }
    }
  }
  return total ? dark * 2 >= total : null;
}

/**
 * The desktop header's full verdict (WOS-336, v3 check() at
 * site/index.html:3638-3642): try each y-line in order and take the FIRST
 * one that resolves — lines are alternatives (logo centre, then the
 * header's bottom edge), never averaged. Nothing resolving anywhere means
 * light, matching the source's `let dark=false` default.
 */
export function isDarkAtLines(xs: number[], ys: number[], ignore: Element): boolean {
  for (const y of ys) {
    const verdict = isDarkAt(xs, y, ignore, true);
    if (verdict !== null) return verdict;
  }
  return false;
}

/**
 * Stop a pinned (sticky/fixed) bar before it rides on top of the footer's
 * sitemap — translates it upward by however far it would otherwise overlap.
 * Always clears each bar's transform first, so the reading reflects where
 * the bar would sit now, not where it was last placed.
 */
export function parkAboveFooter(bars: (HTMLElement | null)[]): void {
  const foot = document.querySelector("footer");
  if (!foot) return;
  const top = foot.getBoundingClientRect().top;
  for (const el of bars) {
    if (!el) continue;
    el.style.transform = "";
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    if (cs.position !== "sticky" && cs.position !== "fixed") continue;
    const over = el.getBoundingClientRect().bottom - top;
    if (over > 0) el.style.transform = `translateY(${-Math.round(over)}px)`;
  }
}
