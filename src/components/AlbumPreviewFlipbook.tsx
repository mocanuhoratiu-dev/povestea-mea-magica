"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

export type AlbumPreviewPage = {
  kind: "cover" | "story";
  imageUrl: string;
  eyebrow: string;
  title: string;
  text: string;
  layout?: "cinematic" | "image-left" | "image-right";
};

export default function AlbumPreviewFlipbook({ pages, childName }: { pages: AlbumPreviewPage[]; childName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const page = pages[activeIndex];
  const layout = page.kind === "story" ? page.layout || "cinematic" : "cinematic";

  return (
    <div className="overflow-hidden border border-brand-gold/70 bg-brand-navy shadow-[0_18px_45px_rgba(9,20,45,.18)]">
      <div className="relative aspect-[210/148] overflow-hidden bg-brand-cream [container-type:inline-size]">
        {page.kind === "cover" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.imageUrl} alt={`Coperta personalizată pentru ${childName}`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,44,.9),rgba(7,24,44,.28)_52%,transparent_76%)]" />
            <div className="absolute inset-y-0 left-0 flex w-[58%] flex-col justify-center p-[7cqw] text-brand-cream [text-shadow:0_2px_16px_rgba(4,12,30,.75)]">
              <p className="text-[1.2cqw] font-black uppercase tracking-[0.16em] text-brand-gold">{page.eyebrow}</p>
              <h3 className="mt-[2cqw] font-serif text-[5cqw] leading-[1.04]">{page.title}</h3>
              <p className="mt-[2.2cqw] text-[1.55cqw] font-bold text-brand-cream/82">{page.text}</p>
            </div>
          </>
        ) : (
          <div className={`grid h-full ${layout === "cinematic" ? "grid-rows-[62%_38%]" : layout === "image-left" ? "grid-cols-[59%_41%]" : "grid-cols-[41%_59%]"}`}>
            <div className={`${layout === "image-right" ? "order-2" : ""} overflow-hidden bg-brand-navy`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.imageUrl} alt={page.title} className="h-full w-full object-cover" />
            </div>
            <div className={`${layout === "image-right" ? "order-1" : ""} flex flex-col justify-center bg-brand-cream ${layout === "cinematic" ? "border-t-[.55cqw] border-brand-gold px-[6.5cqw] py-[2.3cqw]" : layout === "image-left" ? "border-l-[.55cqw] border-brand-gold px-[3.2cqw]" : "border-r-[.55cqw] border-brand-gold px-[3.2cqw]"}`}>
              <p className="text-[1cqw] font-black uppercase tracking-[0.14em] text-brand-purple">{page.eyebrow}</p>
              <h3 className={`mt-[.7cqw] font-serif leading-tight ${layout === "cinematic" ? "text-[2.45cqw]" : "text-[2.7cqw]"}`}>{page.title}</h3>
              <p className={`mt-[1cqw] font-semibold leading-[1.38] text-brand-navy/76 ${layout === "cinematic" ? "text-[1.4cqw]" : "text-[1.48cqw]"}`}>{page.text}</p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden" aria-hidden="true">
          <span className="rotate-[-11deg] border-[.38cqw] border-white/65 bg-brand-navy/25 px-[2.4cqw] py-[.8cqw] text-[2cqw] font-black uppercase tracking-[0.18em] text-white/80 shadow-lg backdrop-blur-[1px]">Mostră privată</span>
        </div>
        <span className="absolute bottom-[1.4cqw] right-[1.8cqw] text-[1.05cqw] font-black text-brand-navy/55">{activeIndex + 1}</span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-brand-gold/35 px-3 py-3 text-brand-cream sm:px-4">
        <button type="button" onClick={() => setActiveIndex((current) => Math.max(0, current - 1))} disabled={activeIndex === 0} aria-label="Pagina anterioară" className="grid h-10 w-10 place-items-center border border-white/20 disabled:opacity-25"><ChevronLeft size={18} /></button>
        <div className="flex items-center justify-center gap-2 text-center text-[11px] font-bold text-brand-cream/75"><ShieldCheck size={15} className="text-brand-gold" /><span>Copertă + 2 pagini reale · {activeIndex + 1} / {pages.length}</span></div>
        <button type="button" onClick={() => setActiveIndex((current) => Math.min(pages.length - 1, current + 1))} disabled={activeIndex === pages.length - 1} aria-label="Pagina următoare" className="grid h-10 w-10 place-items-center border border-white/20 disabled:opacity-25"><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
