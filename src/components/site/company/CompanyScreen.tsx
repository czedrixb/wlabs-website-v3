"use client";

import { usePathname } from "next/navigation";

// WOS-336: the Company screen wrapper — v3's `<section id="company">`,
// which the whole `#company …` rail/tabs layer in site.css is scoped to,
// plus its `is-story` state class (v3 toggles it from the tab router; here
// the active panel is the route). The id is load-bearing: without it the
// sticky tab bar, the rail band's tab-height offset and the story ground
// slab all fall back to the dead-selector state this replaces.
export function CompanyScreen({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStory = /\/company(\/story)?\/?$/.test(pathname);
  return (
    <div id="company" className={isStory ? "is-story" : undefined}>
      {children}
    </div>
  );
}
