import Link from "next/link";

// WOS-342: the "More insights" / 404 "Latest insights" rail card — v3's
// insCard (wlabs-01-wired.html:1871-1876). Deliberately flatter than the
// listing's .insights-item: no image, teal uppercase category (the FIRST
// tag only, per the source), then date, title, dek. Glass surface + hover
// lift come from site.css's .ins-card groups.
export type InsightCardData = {
  href: string;
  category: string;
  dateLabel: string;
  datetime: string;
  title: string;
  dek: string;
};

export function InsightCard({ card }: { card: InsightCardData }) {
  return (
    <Link className="ins-card" href={card.href}>
      <span className="k">{card.category}</span>
      <time dateTime={card.datetime}>{card.dateLabel}</time>
      <h3>{card.title}</h3>
      <p>{card.dek}</p>
    </Link>
  );
}
