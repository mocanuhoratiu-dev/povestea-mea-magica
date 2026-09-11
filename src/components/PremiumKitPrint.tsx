"use client";

import { forwardRef } from "react";
import { buildKitPages } from "@/lib/kits/template";
import { type KitInput, type PremiumKit } from "@/lib/kits/content";
import "./premium-kit-document.css";
import { prepareKitPrintImages } from "@/lib/kits/printImages";
import { kitPageGeometry } from "@/lib/kits/pageGeometry";
import { kitPrintOverflows, prepareKitFontMetrics } from "@/lib/kits/printLayout";

const PremiumKitPrint = forwardRef<HTMLDivElement, { input: KitInput; kit: PremiumKit }>(function PremiumKitPrint({ input, kit }, ref) {
  return <div ref={ref} className="kit-document" data-print="true" aria-hidden="true" style={{ position: "fixed", top: 0, left: -10000, pointerEvents: "none", width: 794, background: "#fff", color: "#26343b" }}>
    {buildKitPages(input, kit).map((page, i) => { const size = kitPageGeometry(page); return <div className="kit-page" data-kit-print-page data-orientation={size.pdfOrientation} style={{width:size.width,height:size.height}} key={i} dangerouslySetInnerHTML={{ __html: page.html }}/>; }) }
  </div>;
});
export default PremiumKitPrint;

export async function renderPremiumKitPdf(root: HTMLElement, expectedPages: number, email = false) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const elements = [...root.querySelectorAll<HTMLElement>(".mk-page,[data-kit-print-page]")];
  if (elements.length !== expectedPages) throw new Error("Materialul nu conține toate paginile.");
  await document.fonts.ready;
  if (root.querySelector(".mk-page")) await Promise.all([document.fonts.load("700 27px Cinzel"), document.fonts.load("400 16px 'Crimson Pro'")]);
  await Promise.all([...root.querySelectorAll("img")].map(async image => { await image.decode(); if (!image.naturalWidth) throw new Error("O ilustrație nu s-a încărcat."); }));
  const orientation = (element: HTMLElement) => kitPageGeometry({orientation: element.dataset.orientation === 'landscape' ? 'landscape' : 'portrait'});
  const pdf = new jsPDF(orientation(elements[0]).pdfOrientation, "mm", "a4");
  for (const [index, element] of elements.entries()) {
    const previous = element.style.display; element.style.display = "block";
    let restoreImages: (() => void) | undefined;
    let restoreFontMetrics: (() => void) | undefined;
    try {
      const paper = element.querySelector<HTMLElement>(".paper");
      if (paper && kitPrintOverflows(paper).length) throw new Error("Textul depășește spațiul de print. Materialul trebuie verificat.");
      restoreImages = await prepareKitPrintImages(element, email ? 1.7 : 2.25);
      if (paper?.classList.contains('gold-keepsake')) restoreFontMetrics = prepareKitFontMetrics();
      const canvas = await html2canvas(element, { scale: email ? 1.7 : 2.25, useCORS: true, backgroundColor: "#fff", logging: false, windowWidth: 1000, windowHeight: 1200 });
      if (!canvas.width || !canvas.height) throw new Error("O pagină nu a putut fi pregătită.");
      const size = orientation(element);
      if (index) pdf.addPage('a4', size.pdfOrientation);
      pdf.addImage(canvas.toDataURL("image/jpeg", email ? .85 : .95), "JPEG", 0, 0, size.widthMm, size.heightMm);
    } finally { restoreFontMetrics?.(); restoreImages?.(); element.style.display = previous; }
  }
  return pdf;
}
