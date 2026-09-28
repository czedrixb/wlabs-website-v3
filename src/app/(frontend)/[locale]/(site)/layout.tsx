import type { Locale } from "@/lib/locale";
import { resolveLocale } from "@/lib/locale";
import { siteFontVariables } from "@/lib/fonts";
import { Header } from "@/components/site/chrome/Header";
import { Masthead } from "@/components/site/chrome/Masthead";
import { TabBar } from "@/components/site/chrome/TabBar";
import { Footer } from "@/components/site/chrome/Footer";
import { LangToggle } from "@/components/site/chrome/LangToggle";
import "@/styles/site.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// The v3 site's own chrome — header/masthead/tab bar/footer/language float —
// wraps every non-blog page. siteFontVariables (src/lib/fonts.ts) is applied
// here rather than on the shared [locale] root layout, so the blog group
// never pulls in Quicksand/Raleway/Noto Sans KR or site.css.
export default async function SiteLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocale(localeParam);

  return (
    <div className={siteFontVariables}>
      <a className="skip" href="#main">
        본문으로 건너뛰기
      </a>
      <Header locale={locale} />
      <Masthead locale={locale} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
      <TabBar locale={locale} />
      <LangToggle locale={locale} />
    </div>
  );
}
