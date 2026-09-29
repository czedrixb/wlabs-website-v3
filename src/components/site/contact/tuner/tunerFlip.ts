// WOS-336: the tuner's FLIP reorder — v3's flip() (site/index.html:
// 5062-5087), verbatim: measure First, reorder the DOM children by
// data-sp-id, apply the match classes (beforeMeasureLast) so Last is
// measured with final styling, invert with a transform, then play .6s
// cubic-bezier(.2,.8,.2,1). Reduced motion, or a container currently
// hidden (zero width), degrades to a plain reorder instead of animating
// from a bogus first rect.

export function flip(
  container: HTMLElement,
  orderIds: (string | number)[],
  opts: { beforeMeasureLast?: () => void; reduced: boolean },
): void {
  const kids = [...container.children] as HTMLElement[];
  const live = container.getBoundingClientRect().width > 0 && !opts.reduced;
  const first = live ? new Map(kids.map((el) => [el, el.getBoundingClientRect()])) : null;
  const byId = new Map(kids.map((el) => [el.dataset.spId, el]));
  const wanted = orderIds.map(String);
  const ordered = [
    ...wanted.map((id) => byId.get(id)).filter((el): el is HTMLElement => Boolean(el)),
    ...kids.filter((el) => !wanted.includes(el.dataset.spId ?? "")),
  ];
  ordered.forEach((el) => container.appendChild(el));
  opts.beforeMeasureLast?.();
  if (!live || !first) return;
  const moving: HTMLElement[] = [];
  ordered.forEach((el) => {
    const f = first.get(el);
    if (!f) return;
    const l = el.getBoundingClientRect();
    const dx = f.left - l.left;
    const dy = f.top - l.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px,${dy}px)`;
    moving.push(el);
  });
  if (moving.length === 0) return;
  container.getBoundingClientRect(); // force layout before playing
  requestAnimationFrame(() =>
    moving.forEach((el) => {
      el.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1), border-color .35s, box-shadow .35s";
      el.style.transform = "";
      el.addEventListener("transitionend", function handler(e) {
        if (e.propertyName !== "transform") return;
        el.style.transition = "";
        el.removeEventListener("transitionend", handler);
      });
    }),
  );
}
