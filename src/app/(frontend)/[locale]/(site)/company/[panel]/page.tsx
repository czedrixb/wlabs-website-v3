import { notFound } from "next/navigation";

const PANELS: Record<string, string> = {
  story: "회사 이야기",
  team: "팀",
  insights: "인사이트",
};

type Props = { params: Promise<{ panel: string }> };

// Stub — WOS-314 Milestone 1 covers chrome + Home only; Company's real
// content (team collection, timeline rail) is a later step.
export default async function CompanyPanelPage({ params }: Props) {
  const { panel } = await params;
  const label = PANELS[panel];
  if (!label) notFound();

  return (
    <div className="wrap page-head">
      <span className="eyebrow">회사</span>
      <h1>{label}</h1>
    </div>
  );
}
