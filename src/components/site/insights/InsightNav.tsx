import Link from "next/link";
import type { SiteStrings } from "@/lib/site/dictionary";

// WOS-342: date-ordered prev/next under the article — v3's `cell()`
// (wlabs-01-wired.html:1925-1929, :1947-1949). prev = newer, next = older,
// relation ignored; a missing neighbour renders as a dimmed "Nothing
// further" placeholder so the two-cell grid never collapses.
export type InsightNavCell = { href: string; title: string } | undefined;

type Props = { s: SiteStrings["insights"]; prev: InsightNavCell; next: InsightNavCell };

const ARW_L = (
  <svg className="arw" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);
const ARW_R = (
  <svg className="arw" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

function Cell({
  cell,
  cls,
  label,
  nothing,
}: {
  cell: InsightNavCell;
  cls: "pv" | "nx";
  label: string;
  nothing: string;
}) {
  const tx = (
    <span className="tx">
      <span className="l">{label}</span>
      <span className="t">{cell ? cell.title : nothing}</span>
    </span>
  );
  const inner = cls === "pv" ? [ARW_L, tx] : [tx, ARW_R];
  if (!cell) {
    return (
      <div className={`ins-ph ${cls}`}>
        {inner[0]}
        {inner[1]}
      </div>
    );
  }
  return (
    <Link className={cls} href={cell.href}>
      {inner[0]}
      {inner[1]}
    </Link>
  );
}

export function InsightNav({ s, prev, next }: Props) {
  return (
    <nav className="ins-nav" aria-label={s.insNavAria}>
      <Cell cell={prev} cls="pv" label={s.prevNewer} nothing={s.nothingFurther} />
      <Cell cell={next} cls="nx" label={s.nextOlder} nothing={s.nothingFurther} />
    </nav>
  );
}
