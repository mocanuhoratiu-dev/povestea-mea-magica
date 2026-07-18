"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

export type ReaderCrop = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ReaderPage = {
  title: string;
  caption: string;
  crop: ReaderCrop;
  source?: string;
};

type ProductReaderProps = {
  title: string;
  source: string;
  pages: ReaderPage[];
};

function CropPage({ source, crop, alt, className = "" }: { source: string; crop: ReaderCrop; alt: string; className?: string }) {
  const zoomX = 10000 / crop.width;
  const zoomY = 10000 / crop.height;
  const moveX = -crop.left;
  const moveY = -crop.top;

  return (
    <div className={`relative aspect-[0.707] overflow-hidden bg-brand-cream ${className}`}>
      <Image
        src={source}
        alt={alt}
        width={1200}
        height={1140}
        sizes="(min-width: 1024px) 45vw, 90vw"
        className="absolute left-0 top-0 max-w-none"
        style={{ width: `${zoomX}%`, height: `${zoomY}%`, transform: `translate(${moveX}%, ${moveY}%)` }}
      />
    </div>
  );
}

export default function ProductReader({ title, source, pages }: ProductReaderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const activePage = pages[activeIndex];
  const goTo = (index: number) => setActiveIndex((index + pages.length) % pages.length);

  return (
    <div className="border border-brand-navy/15 bg-white p-3 shadow-[0_18px_40px_rgba(36,50,79,0.12)] sm:p-5">
      <div className="flex items-center justify-between border-b border-brand-navy/10 pb-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-navy/55">Răsfoiește paginile</p>
        <p className="text-xs font-black tabular-nums text-brand-purple">{activeIndex + 1} / {pages.length}</p>
      </div>

      <div className="relative mx-auto mt-5 max-w-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="border border-brand-navy/15 shadow-[0_14px_26px_rgba(36,50,79,0.16)]"
          >
            <CropPage source={activePage.source ?? source} crop={activePage.crop} alt={`${title}: ${activePage.title}`} />
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          aria-label="Pagina anterioară"
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border border-brand-navy/15 bg-brand-cream/95 text-brand-navy shadow-sm transition hover:bg-white"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="Pagina următoare"
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border border-brand-navy/15 bg-brand-cream/95 text-brand-navy shadow-sm transition hover:bg-white"
        >
          <ChevronRight size={20} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-2 bg-brand-navy px-3 py-2 text-xs font-black text-brand-cream transition hover:bg-brand-purple"
        >
          <Expand size={14} /> Mărește
        </button>
      </div>

      <div className="mt-4 min-h-[78px] text-center">
        <p className="font-serif text-2xl text-brand-navy">{activePage.title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-brand-navy/65">{activePage.caption}</p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(pages.length, 5)}, minmax(0, 1fr))` }}>
        {pages.map((page, index) => (
          <button
            type="button"
            key={page.title}
            onClick={() => setActiveIndex(index)}
            aria-label={`Arată pagina ${index + 1}: ${page.title}`}
            aria-pressed={activeIndex === index}
            className={`overflow-hidden border transition ${activeIndex === index ? "border-brand-purple ring-2 ring-brand-purple/25" : "border-brand-navy/15 opacity-70 hover:opacity-100"}`}
          >
            <CropPage source={page.source ?? source} crop={page.crop} alt="" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] grid place-items-center bg-brand-navy/90 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${title}: ${activePage.title}`}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="relative max-h-[92vh] w-auto max-w-[min(94vw,760px)] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <CropPage source={activePage.source ?? source} crop={activePage.crop} alt={`${title}: ${activePage.title}`} className="max-h-[86vh]" />
              <button type="button" onClick={() => setExpanded(false)} className="absolute right-3 top-3 bg-brand-cream px-3 py-2 text-xs font-black text-brand-navy shadow-sm">Închide</button>
              <div className="absolute bottom-0 left-0 right-0 bg-brand-navy/85 px-5 py-4 text-brand-cream"><p className="font-serif text-2xl">{activePage.title}</p></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
