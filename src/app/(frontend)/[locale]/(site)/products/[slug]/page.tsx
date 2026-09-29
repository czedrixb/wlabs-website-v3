// Stub — WOS-314 Milestone 1 covers chrome + Home only; real product pages
// (SkinArch, BrainArch, WIZ) are a later step.
type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="wrap page-head">
      <span className="eyebrow">제품</span>
      <h1>{slug}</h1>
    </div>
  );
}
