import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/locale";

type Props = { params: Promise<{ locale: string }> };

// Same shape as company/page.tsx. v3's own bare `#legal` falls back to
// `terms` (renderLegal()'s `if(!LEGAL[which])which='terms'`); privacy is
// listed first in the footer and is the document people actually look for,
// so this is a deliberate, minor deviation from that default.
export default async function LegalIndexRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${resolveLocale(locale)}/legal/privacy`);
}
