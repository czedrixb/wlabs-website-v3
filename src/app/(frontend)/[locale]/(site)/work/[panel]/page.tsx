import { notFound } from "next/navigation";

const PANELS: Record<string, string> = {
  services: "서비스",
  products: "제품",
  cases: "프로젝트",
};

type Props = { params: Promise<{ panel: string }> };

// Stub — WOS-314 Milestone 1 covers chrome + Home only; Work's real
// segmented content is a later step.
export default async function WorkPanelPage({ params }: Props) {
  const { panel } = await params;
  const label = PANELS[panel];
  if (!label) notFound();

  return (
    <div className="wrap page-head">
      <span className="eyebrow">하는 일</span>
      <h1>{label}</h1>
    </div>
  );
}
