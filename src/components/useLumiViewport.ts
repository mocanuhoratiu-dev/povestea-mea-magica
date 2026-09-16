"use client";

import { useEffect, type RefObject } from "react";

// Mobile keyboards can shrink the visual viewport without resizing the page.
export function useLumiViewport(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = ref.current;
    if (!open || !viewport || !root) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (viewport.scale > 1.01) return;
      root.style.setProperty("--lumi-visible-height", `${viewport.height}px`);
      root.style.setProperty("--lumi-visible-bottom", `${Math.max(0, innerHeight - viewport.height - viewport.offsetTop)}px`);
      root.dataset.compactViewport = String(viewport.height < 500);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--lumi-visible-height");
      root.style.removeProperty("--lumi-visible-bottom");
      delete root.dataset.compactViewport;
    };
  }, [ref, open]);
}
