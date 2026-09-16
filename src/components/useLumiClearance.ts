"use client";

import { useEffect, useState, type RefObject } from "react";

// Keep the floating invitation clear of controls, without moving it under the pointer.
export function useLumiClearance(ref: RefObject<HTMLDivElement | null>, enabled: boolean, route: string, compact: boolean) {
  const [obstructed, setObstructed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const launcher = ref.current;
      if (!launcher) return;
      const bounds = launcher.getBoundingClientRect();
      const controls = document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, summary, [data-lumi-obstacle]");
      const blocked = Boolean(document.querySelector("dialog[open]")) || Array.from(controls).some(control => {
        if (control.closest("[data-lumi-guide]")) return false;
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.top >= innerHeight || rect.bottom <= 0) return false;
        return rect.left < bounds.right + 8 && rect.right > bounds.left - 8 && rect.top < bounds.bottom + 8 && rect.bottom > bounds.top - 8;
      });
      setObstructed(blocked);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    if (ref.current) resize.observe(ref.current);
    const mutation = new MutationObserver(schedule);
    mutation.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
    };
  }, [ref, enabled, route, compact]);
  return enabled && obstructed;
}
