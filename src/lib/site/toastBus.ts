// WOS-336: the toast channel. v3's toast is a body-level singleton any
// script can call (site/index.html:3759); the React equivalent keeps that
// shape as a module-scoped bus — showToast() can be called from any client
// component (both inquiry forms, wherever they sit in the tree) without
// threading a context through the server components between them, and
// <Toaster> (mounted once in SiteChrome) is the single subscriber that
// renders it.

export type ToastKind = "success" | "error";

export type ToastPayload = {
  kind: ToastKind;
  title: string;
  msg?: string;
  /** Auto-hide delay; v3's default is 6500ms, failures pass 9000. */
  ms?: number;
};

type Listener = (toast: ToastPayload) => void;

let listener: Listener | null = null;

export function showToast(toast: ToastPayload): void {
  listener?.(toast);
}

/** One subscriber at a time — the mounted Toaster. Returns its unsubscribe. */
export function onToast(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}
