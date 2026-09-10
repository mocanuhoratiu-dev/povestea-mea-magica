"use client";

import { forwardRef } from "react";
import { CLASSIC_SHIELD_STYLES, ClassicShieldPages } from "./NightShieldClassicPages";
import { classicShieldKits } from "@/lib/kits/classic";
import { buildKitPages } from "@/lib/kits/template";
import { KIT_FEAR_OPTIONS, type KitInput, type PremiumKit } from "@/lib/kits/content";
import "./premium-kit-document.css";

const PremiumKitPrint = forwardRef<HTMLDivElement, { input: KitInput; kit: PremiumKit }>(function PremiumKitPrint({ input, kit }, ref) {
  return <div ref={ref} className="kit-document" data-print="true" aria-hidden="true" style={{ position: "fixed", top: 0, left: -10000, pointerEvents: "none", width: 794, background: "#fff", color: "#26343b" }}>
    {input.type === "monster" && <><style>{CLASSIC_SHIELD_STYLES}</style><ClassicShieldPages name={input.name} fearLabel={KIT_FEAR_OPTIONS.find(([id]) => id === input.monster)?.[1] || "întuneric"} location={input.context} helper={input.interest || input.trustedAdult} ritual={input.tone || "o îmbrățișare"} kit={classicShieldKits[input.monster] || classicShieldKits["frica de intuneric"]}/></>}
    {buildKitPages(input, kit).map((page, i) => <div className="kit-page" data-kit-print-page key={i} dangerouslySetInnerHTML={{ __html: page.html }}/>) }
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
  const pdf = new jsPDF("p", "mm", "a4");
  for (const [index, element] of elements.entries()) {
    const previous = element.style.display; element.style.display = "block";
    try {
      const paper = element.querySelector<HTMLElement>(".paper");
      if (paper) {
        const foot = paper.querySelector(".folio")?.getBoundingClientRect();
        if (foot && [...paper.querySelectorAll("p,h2,h3,.note,.quote")].some(node => node.getBoundingClientRect().bottom > foot.top - 3)) throw new Error("Textul depășește spațiul de print. Materialul trebuie verificat.");
      }
      const canvas = await html2canvas(element, { scale: email ? 1.7 : 2.25, useCORS: true, backgroundColor: "#fff", logging: false, windowWidth: 1000, windowHeight: 1200 });
      if (!canvas.width || !canvas.height) throw new Error("O pagină nu a putut fi pregătită.");
      if (index) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", email ? .85 : .95), "JPEG", 0, 0, 210, 297);
    } finally { element.style.display = previous; }
  }
  return pdf;
}
