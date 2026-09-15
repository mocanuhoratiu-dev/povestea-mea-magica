"use client";

import { useEffect } from "react";

export default function PreviewSessionGuard() {
  useEffect(() => {
    let active = false;
    let stopped = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function check() {
      if (stopped || checking) return;
      checking = true;
      clearTimeout(timer);
      try {
        const response = await fetch("/api/preview-access", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("preview_status_unavailable");
        const state = await response.json();
        if (state.launchOpen) { stopped = true; return; }
        if (active && !state.authenticated) {
          const next = `${location.pathname}${location.search}${location.hash}`;
          location.replace(`/acces-preview?expired=1&next=${encodeURIComponent(next)}`);
          stopped = true;
          return;
        }
        active = state.authenticated === true;
        if (active) timer = setTimeout(check, Math.max(1000, Math.min(60000, state.expiresAt - Date.now() + 1000)));
      } catch {
        // A temporary network error must not interrupt delivery of a paid order.
        if (active && !stopped) timer = setTimeout(check, 15000);
      } finally { checking = false; }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);
  return null;
}
