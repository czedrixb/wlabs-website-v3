import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";

type Props = { locale: Locale };

// The inquiry/partnership buttons and the privacy/terms links point at the
// contact sheet and a company panel in v3 — that modal system and those
// legal pages don't exist yet (WOS-314 Step 4 scope is chrome + Home only),
// so for now they resolve to real routes instead of opening anything.
export function Footer({ locale }: Props) {
  return (
    <footer>
      <div className="wrap">
        <Link className="lockup foot-lockup" href={withLocale("/", locale)} aria-label="W Labs">
          <img className="logo-h" src="/site/logo/primary-land.svg" alt="W Labs" aria-hidden="true" />
        </Link>

        <nav className="sitemap" aria-label="사이트맵">
          <div>
            <h4>
              <Link href={withLocale("/work", locale)}>하는 일</Link>
            </h4>
            <Link href={withLocale("/work/services", locale)}>서비스</Link>
            <Link href={withLocale("/work/products", locale)}>제품</Link>
            <Link href={withLocale("/work/cases", locale)}>프로젝트</Link>
          </div>
          <div>
            <h4>
              <Link href={withLocale("/company", locale)}>회사</Link>
            </h4>
            <Link href={withLocale("/company/story", locale)}>회사 이야기</Link>
            <Link href={withLocale("/company/team", locale)}>팀</Link>
            <Link href={withLocale("/company/insights", locale)}>인사이트</Link>
          </div>
          <div>
            <h4>
              <Link href={withLocale("/contact", locale)}>프로젝트 문의</Link>
            </h4>
            <Link href={withLocale("/contact", locale)}>프로젝트 상담하기</Link>
            <Link href={withLocale("/contact", locale)}>파트너십</Link>
          </div>
          <div>
            <h4>법적 고지</h4>
            <Link href={withLocale("/company", locale)}>개인정보처리방침</Link>
            <Link href={withLocale("/company", locale)}>이용약관</Link>
            <Link href={withLocale("/search", locale)}>검색</Link>
          </div>
        </nav>

        <div className="foot-legal">
          <div className="foot-biz">
            <span>더블유랩스 (W Labs) · 대표 정원석</span>
            <span>서울 · 사업자등록번호 및 D-U-N-S® 번호는 확인 후 게재</span>
            <span>성장과 디지털 전환의 파트너</span>
          </div>
          <div className="foot-meta">
            <span>© 2026 W Labs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
