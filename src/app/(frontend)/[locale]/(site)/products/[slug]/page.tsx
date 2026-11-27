import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { resolveLocale, withLocale } from "@/lib/locale";
import { PRODUCTS, SERVICES, type ProductId } from "@/lib/site/content";
import { siteMetadata } from "@/lib/site/metadata";
import { siteT } from "@/lib/site/dictionary";
import { ProductGallery } from "@/components/site/work/ProductGallery";

type Props = { params: Promise<{ locale: string; slug: string }> };

const PRODUCT_IDS = Object.keys(PRODUCTS) as ProductId[];

export function generateStaticParams() {
  return PRODUCT_IDS.flatMap((slug) => [
    { locale: "ko", slug },
    { locale: "en", slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const product = PRODUCTS[slug as ProductId];
  if (!product) return {};
  return siteMetadata({
    locale,
    path: `/products/${slug}`,
    title: product.name,
    description: locale === "en" ? product.lead.en : product.lead.ko,
  });
}

// Every string below is a literal bilingual pair, not a dictionary key —
// v3's own `renderProduct()` (site/index.html:3287) builds this whole page
// by string-templating `bi(en, ko)` calls at runtime rather than marking
// its markup up with `data-i`, so none of this went through the WOS-331/
// WOS-332 dictionary harvest. Transcribed here verbatim for the same
// reason CTA_CARD is a literal in ProjectGrid.tsx.
const T = {
  crumbWork: { en: "Work", ko: "하는 일" },
  crumbProducts: { en: "Products", ko: "제품" },
  ruo: { en: "Research use only", ko: "연구용" },
  askAbout: (name: string) => ({ en: `Ask about ${name}`, ko: `${name} 문의` }),
  allProducts: { en: "All products", ko: "모든 제품" },
  whatItDoes: { en: "What it does", ko: "무엇을 하나요" },
  capabilities: { en: "Capabilities", ko: "주요 기능" },
  howItFits: { en: "How it fits", ko: "어떻게 쓰나요" },
  workflowH2: { en: "Your workflow, three steps", ko: "세 단계의 워크플로" },
  whoItsFor: { en: "Who it is for", ko: "누구를 위한가요" },
  related: { en: "Related", ko: "관련" },
  whereFrom: { en: "Where this comes from", ko: "이 제품의 배경" },
  wantToSee: (name: string) => ({ en: `Want to see ${name} on your data?`, ko: `내 데이터로 ${name}을 보고 싶다면` }),
  // WOS-383: the new sections (v3 renderProduct, verbatim). The pilot CTA
  // for a product still in development has no approved Korean yet, so both
  // slots carry the English, exactly as v3 does.
  inDev: { en: "In development", ko: "In development" },
  overview: { en: "Overview", ko: "개요" },
  about: (name: string) => ({ en: `About ${name}`, ko: `${name} 소개` }),
  seeIt: { en: "See it", ko: "살펴보기" },
  inAction: (name: string) => ({ en: `${name} in action`, ko: `${name} 미리 보기` }),
  whyItExists: { en: "Why it exists", ko: "왜 만들었나요" },
  problems: { en: "The problems it takes on", ko: "해결하려는 문제" },
  gettingStarted: { en: "Getting started", ko: "시작하기" },
  setupH2: { en: "Set-up, simplified", ko: "간단한 도입 절차" },
  pilotH2: { en: "How a pilot would start", ko: "파일럿은 이렇게 시작합니다" },
  questions: { en: "Questions", ko: "자주 묻는 질문" },
  goodToKnow: { en: "Good to know", ko: "알아 두면 좋은 것" },
  pilotCta: (name: string) => ({ en: `Interested in a ${name} pilot?`, ko: `Interested in a ${name} pilot?` }),
  wantToSeeLead: {
    en: "Tell us about your setup and we will come back with the right next step.",
    ko: "환경을 알려 주시면 적절한 다음 단계를 안내드립니다.",
  },
};

export default async function ProductPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale: Locale = resolveLocale(localeParam);
  const en = locale === "en";
  const product = PRODUCTS[slug as ProductId];
  if (!product) notFound();

  const pick = (b: { en: string; ko: string }) => (en ? b.en : b.ko);
  const more = product.more;
  const media = `/site/media/products/${product.id}`;
  const ins = siteT(locale).insights;
  const t = <K extends keyof typeof T>(key: K) => (en ? (T[key] as { en: string }).en : (T[key] as { ko: string }).ko);

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="breadcrumb">
        <Link href={withLocale("/work", locale)}>{t("crumbWork")}</Link>
        <span>/</span>
        <Link href={withLocale("/work/products", locale)}>{t("crumbProducts")}</Link>
        <span>/</span>
        <b>{product.name}</b>
      </nav>
      <header className="prod-head">
        <div style={{ display: "grid", gap: "var(--s2)" }}>
          <div className="tag">
            <span className="eyebrow">{en ? product.cat.en : product.cat.ko}</span>
            {product.ruo && <span className="ruo">{t("ruo")}</span>}
            {product.dev && <span className="ruo">{t("inDev")}</span>}
          </div>
          <h1>{product.name}</h1>
          <p className="lead">{en ? product.lead.en : product.lead.ko}</p>
          <div className="cta">
            {/* data-contact preselects the sheet's topic — v3's product
                pages use the product's own topic id (index.html:3578);
                href is the no-JS fallback (WOS-336). */}
            <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={product.topic}>
              <span>{en ? T.askAbout(product.name).en : T.askAbout(product.name).ko}</span>
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className="btn btn-ghost" href={withLocale("/work/products", locale)}>
              {t("allProducts")}
            </Link>
          </div>
        </div>
        <div className="prod-visual pvis" aria-hidden="true">
          {/* fill, not width/height: .prod-visual is aspect-ratio-driven
              and its concrete size varies by breakpoint (site.css's
              .prod-visual/.pvis rules) — fill lets it track the container
              instead of the image's own intrinsic size. */}
          <Image
            src={`/site/img/${product.id}.webp`}
            alt=""
            fill
            sizes="(min-width: 744px) 430px, 100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </header>

      {product.about && (
        // WOS-383: four paragraphs beside an image; on desktop the text sets
        // the row height and the image is cropped to fill it (site.css).
        <section className="prod-sec">
          <div className="section-head">
            <span className="eyebrow">{t("overview")}</span>
            <h2>{pick(T.about(product.name))}</h2>
          </div>
          <div className="prod-about-wrap">
            <div className="prod-about">
              {product.about.map((para, i) => (
                <p key={i}>{pick(para)}</p>
              ))}
            </div>
            <figure className="prod-about-img">
              <Image src={`${media}/overview.webp`} alt="" fill sizes="(min-width: 900px) 40vw, 100vw" />
            </figure>
          </div>
        </section>
      )}

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("whatItDoes")}</span>
          <h2>{t("capabilities")}</h2>
        </div>
        <div className="feats">
          {product.feats.map((f, i) => (
            <article className="feat" key={i}>
              <span className="num">0{i + 1}</span>
              <h3>{en ? f.title.en : f.title.ko}</h3>
              <p>{en ? f.body.en : f.body.ko}</p>
            </article>
          ))}
        </div>
      </section>

      {more && (
        <>
          <section className="prod-sec">
            <div className="section-head">
              <span className="eyebrow">{t("seeIt")}</span>
              <h2>{pick(T.inAction(product.name))}</h2>
            </div>
            {more.video && (
              <figure className="pg-video">
                <video controls preload="none" playsInline poster={`${media}/poster.webp`}>
                  <source src={`${media}/video.mp4`} type="video/mp4" />
                </video>
                <figcaption>{pick(more.video.label)}</figcaption>
              </figure>
            )}
            <ProductGallery
              stills={more.gallery.map((c, i) => ({ src: `${media}/g${i + 1}.webp`, caption: pick(c) }))}
              expandLabel={ins.expandImage}
              closeLabel={ins.lightboxClose}
            />
          </section>

          <section className="prod-sec">
            <div className="section-head">
              <span className="eyebrow">{t("whyItExists")}</span>
              <h2>{t("problems")}</h2>
            </div>
            <div className="goals">
              {more.goals.map((g, i) => (
                <article className="goal" key={i}>
                  <h3>{pick(g.title)}</h3>
                  <p>{pick(g.body)}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("howItFits")}</span>
          <h2>{t("workflowH2")}</h2>
        </div>
        <div className="steps">
          {product.steps.map((st, i) => (
            <div className="step" key={i}>
              <div>
                <h3>{en ? st.title.en : st.title.ko}</h3>
                <p>{en ? st.body.en : st.body.ko}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {more && (
        <section className="prod-sec">
          <div className="section-head">
            <span className="eyebrow">{t("gettingStarted")}</span>
            <h2>{product.dev ? t("pilotH2") : t("setupH2")}</h2>
          </div>
          <ol className="setup">
            {more.setup.map((st, i) => (
              <li key={i}>
                <span className="num">0{i + 1}</span>
                <div>
                  <h3>{pick(st.title)}</h3>
                  <p>{pick(st.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("whoItsFor")}</span>
          <div>
            <h2>{en ? product.whoH.en : product.whoH.ko}</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              {en ? product.who.en : product.who.ko}
            </p>
          </div>
        </div>
        <dl className="facts">
          {product.facts.map((f, i) => (
            <div key={i}>
              <dt>{en ? f.label.en : f.label.ko}</dt>
              <dd>{en ? f.body.en : f.body.ko}</dd>
            </div>
          ))}
        </dl>
        {product.note && <p className="note" style={{ marginTop: "var(--s3)" }}>{en ? product.note.en : product.note.ko}</p>}
      </section>

      {more && (
        <section className="prod-sec">
          <div className="section-head">
            <span className="eyebrow">{t("questions")}</span>
            <h2>{t("goodToKnow")}</h2>
          </div>
          <div className="pfaq">
            {more.faq.map((q, i) => (
              <details key={i}>
                <summary>{pick(q.q)}</summary>
                <p>{pick(q.a)}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="prod-sec">
        <div className="section-head">
          <span className="eyebrow">{t("related")}</span>
          <h2>{t("whereFrom")}</h2>
        </div>
        <div className="prod-rel">
          {product.rel.map((r) => {
            if (r.kind === "project") {
              return (
                <Link className="rel-item" href={withLocale(`/projects/${r.id}`, locale)} key={r.abbr + r.id}>
                  <span className="initial" aria-hidden="true">
                    {r.abbr}
                  </span>
                  <span>{r.label}</span>
                </Link>
              );
            }
            const svc = SERVICES.find((s) => s.abbr === r.abbr);
            return (
              <Link className="rel-item" href={withLocale(svc ? `/work/services#${svc.anchor}` : "/work/services", locale)} key={r.abbr}>
                <span className="initial" aria-hidden="true">
                  {r.abbr}
                </span>
                <span>{en ? r.label.en : r.label.ko}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <aside className="prod-cta">
        <div>
          <h2>{pick(product.dev ? T.pilotCta(product.name) : T.wantToSee(product.name))}</h2>
          <p className="lead" style={{ marginTop: 8 }}>
            {t("wantToSeeLead")}
          </p>
        </div>
        <div className="cta">
          <Link className="btn btn-primary" href={withLocale("/contact", locale)} data-contact={product.topic}>
            <span>{en ? T.askAbout(product.name).en : T.askAbout(product.name).ko}</span>
            <span className="arr" aria-hidden="true">
              ↗
            </span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
