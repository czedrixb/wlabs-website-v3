// Stub — WOS-314 Milestone 1 covers chrome + Home only; real project pages
// are a later step.
type Props = { params: Promise<{ slug: string }> };

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="wrap page-head">
      <span className="eyebrow">프로젝트</span>
      <h1>{slug}</h1>
    </div>
  );
}
