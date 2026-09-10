"use client";

import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KitPage } from "@/lib/kits/template";
import "./premium-kit-document.css";

export default function PremiumKitReader({ pages, label = "Răsfoiește materialul" }: { pages: KitPage[]; label?: string }) {
  const [index, setIndex] = useState(0), [width, setWidth] = useState(600), [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const safeIndex = Math.min(index, pages.length - 1);
  const page = pages[safeIndex];
  useEffect(() => { const node = root.current; if (!node) return; const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width)); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => { if (expanded) dialog.current?.showModal(); else dialog.current?.close(); }, [expanded]);
  const scale = Math.min(1, Math.max(1, width) / 600);
  const interact = (event: React.MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-kit-action]");
    const paper = button?.closest(".paper"); if (!button || !paper) return;
    if (button.dataset.kitAction === "day") { const checked = button.getAttribute("aria-pressed") !== "true"; button.setAttribute("aria-pressed", String(checked)); button.textContent = checked ? "✓" : ""; }
    if (button.dataset.kitAction === "shadow") paper.querySelector(".shadow-demo")?.classList.toggle("revealed");
    if (button.dataset.kitAction === "maze") paper.querySelector(".maze-area")?.classList.toggle("solved");
    if (button.dataset.kitAction === "differences") paper.querySelector(".difference-grid")?.classList.toggle("solved");
  };
  if (!page) return null;
  return <section aria-label={label} className="pk-reader">
    <div className="pk-reader-heading"><div><span>{label}</span><strong>{page.title}</strong></div><button type="button" aria-label="Mărește pagina" title="Mărește pagina" onClick={() => setExpanded(true)}><Expand size={18}/></button></div>
    <div className="pk-reader-stage"><div ref={root} style={{ width: "100%", maxWidth: 600, margin: "auto" }}><div style={{ width: 600 * scale, height: 848.5714 * scale, position: "relative" }}><div className="kit-document" onClick={interact} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 600, height: 848.5714 }} dangerouslySetInnerHTML={{ __html: page.html }}/></div></div></div>
    <div className="pk-reader-controls"><button type="button" disabled={safeIndex === 0} aria-label="Pagina anterioară" title="Pagina anterioară" onClick={() => setIndex(safeIndex - 1)}><ArrowLeft size={18}/></button><span aria-live="polite">{safeIndex + 1} / {pages.length}</span><button type="button" disabled={safeIndex === pages.length - 1} aria-label="Pagina următoare" title="Pagina următoare" onClick={() => setIndex(safeIndex + 1)}><ArrowRight size={18}/></button></div>
    <dialog ref={dialog} className="pk-reader-dialog" onClose={() => setExpanded(false)} onClick={event => { if (event.target === dialog.current) setExpanded(false); }}><header><strong>{page.title}</strong><button type="button" title="Închide" aria-label="Închide pagina mărită" onClick={() => setExpanded(false)}><X size={20}/></button></header><div className="pk-zoom-scroll"><div className="kit-document" onClick={interact} style={{ width: 600, height: 848.5714, position: "relative" }} dangerouslySetInnerHTML={{ __html: page.html }}/></div></dialog>
  </section>;
}
