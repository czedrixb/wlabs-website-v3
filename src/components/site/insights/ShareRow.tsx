"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteStrings } from "@/lib/site/dictionary";

// WOS-342: the article's share row — v3's shareRow + copy-link handler
// (wlabs-01-wired.html:1721-1738). Facebook and LinkedIn are plain sharer
// anchors; the copy button writes the URL to the clipboard and rings teal
// (.sh.done, a check icon) for two seconds. The URL is built server-side
// and passed in, so this stays independent of window.location.
type Props = { s: SiteStrings["insights"]; url: string };

const ICON_FB = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 0C18.6274 0 24 5.37259 24 12C24 18.1352 19.3955 23.1944 13.4538 23.9121V15.667L16.7001 15.667L17.3734 12H13.4538V10.7031C13.4538 9.73417 13.6439 9.06339 14.0799 8.63483C14.5159 8.20627 15.1979 8.01993 16.1817 8.01993C16.4307 8.01993 16.6599 8.02241 16.8633 8.02736C17.1591 8.03456 17.4002 8.047 17.568 8.06467V4.74048C17.501 4.72184 17.4218 4.70321 17.3331 4.68486C17.1321 4.6433 16.8822 4.60324 16.6136 4.56806C16.0523 4.49453 15.4093 4.4423 14.9594 4.4423C13.1424 4.4423 11.7692 4.83102 10.8107 5.63619C9.65388 6.60791 9.10108 8.18622 9.10108 10.4199V12H6.62659V15.667H9.10108V23.6466C3.87432 22.3498 0 17.6277 0 12C0 5.37259 5.37259 0 12 0Z"
      fill="#4460A0"
    />
  </svg>
);
const ICON_LI = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      fill="#0A66C2"
      d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z"
    />
  </svg>
);
const ICON_LINK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);
const ICON_OK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export function ShareRow({ s, url }: Props) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // v3's own fallback for clipboard-less contexts
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.append(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        // nothing left to try — the button still shows the done state,
        // matching the source's behaviour
      }
      ta.remove();
    }
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2000);
  }

  const u = encodeURIComponent(url);
  return (
    <div className="ins-share">
      <span className="l">{s.share}</span>
      <a
        className="sh ic brand"
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={s.shareFb}
        title={s.shareFb}
      >
        {ICON_FB}
      </a>
      <a
        className="sh ic brand"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={s.shareLi}
        title={s.shareLi}
      >
        {ICON_LI}
      </a>
      <button
        type="button"
        className={done ? "sh ic done" : "sh ic"}
        aria-label={s.copyLink}
        title={s.copyLink}
        onClick={copy}
      >
        {done ? ICON_OK : ICON_LINK}
      </button>
    </div>
  );
}
