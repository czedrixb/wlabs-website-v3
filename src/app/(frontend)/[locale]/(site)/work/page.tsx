import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/locale";

type Props = { params: Promise<{ locale: string }> };

export default async function WorkIndexRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${resolveLocale(locale)}/work/services`);
}
