"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "@/lib/locale";

// WOS-346: lets a page tell the floating LangToggle where its other-language
// version actually lives. AISEN insight posts are published per language —
// /en/insights/{slug} is a real 404 until a writer publishes the English
// version — so the toggle's default prefix-swap would link straight into a
// 404 there. Pages that don't render <SetLangTargets> (everything bilingual
// by construction: CMS posts, the (site) routes) keep the default swap.
//
// `string` = an explicit href for that locale (e.g. the translation's own
// slug, which may differ); `null` = no version exists, send the visitor to
// that locale's insights list instead. The map lives in client state above
// the page (SiteChrome wraps everything in the provider), because LangToggle
// is a chrome sibling of <main> — no server prop can reach it from a page.

export type LangTargets = Partial<Record<Locale, string | null>>;

type Ctx = {
  targets: LangTargets;
  setTargets: (t: LangTargets) => void;
};

const LangTargetCtx = createContext<Ctx>({ targets: {}, setTargets: () => {} });

export function LangTargetProvider({ children }: { children: React.ReactNode }) {
  const [targets, setTargets] = useState<LangTargets>({});
  return <LangTargetCtx.Provider value={{ targets, setTargets }}>{children}</LangTargetCtx.Provider>;
}

export function useLangTargets(): LangTargets {
  return useContext(LangTargetCtx).targets;
}

/**
 * Rendered by a page (inside <main>) to override the toggle's targets while
 * that page is mounted. Runs in an effect, so the server render and first
 * paint still carry the default prefix-swap hrefs — acceptable, since SEO
 * language discovery rides on hreflang, not on this control — and clears
 * itself on unmount so client-side navigation can't leak one page's targets
 * onto the next.
 */
export function SetLangTargets({ targets }: { targets: LangTargets }) {
  const { setTargets } = useContext(LangTargetCtx);
  useEffect(() => {
    setTargets(targets);
    return () => setTargets({});
    // Re-run only when the actual mapping changes, not on every render of a
    // parent that re-creates the object literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(targets), setTargets]);
  return null;
}
