"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/clientTelemetry";

type SamplePage = {
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  alt: string;
};

type ProductSampleGalleryProps = {
  product: "monster" | "emergency";
  tone: "night" | "day";
  eyebrow: string;
  title: string;
  description: string;
  pages: SamplePage[];
  facts: string[];
  ctaHref: string;
  ctaLabel: string;
};

export default function ProductSampleGallery({
  product,
  tone,
  eyebrow,
  title,
  description,
  pages,
  facts,
  ctaHref,
  ctaLabel,
}: ProductSampleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const activePage = pages[activeIndex];
  const isNight = tone === "night";

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  const goTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(pages.length - 1, index));
    setActiveIndex(nextIndex);
    trackEvent("product_sample_page_viewed", { product, samplePage: nextIndex + 1 });
  };

  const pagePreview = (large = false) => (
    <div className={`relative mx-auto aspect-[.707] w-full overflow-hidden border shadow-[0_28px_80px_rgba(5,12,28,.34)] ${large ? "max-h-[82dvh] max-w-[58dvh]" : "max-w-[520px]"} ${isNight ? "border-brand-gold/55 bg-brand-navy" : "border-brand-navy/20 bg-white"}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage.image}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 22, rotateY: -4 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -18, rotateY: 3 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image src={activePage.image} alt={activePage.alt} fill sizes={large ? "60dvh" : "(min-width: 1024px) 42vw, 88vw"} className="object-cover" />
        </motion.div>
      </AnimatePresence>
      <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Pagina anterioară" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/30 bg-brand-navy/82 text-white backdrop-blur-sm transition hover:bg-brand-purple disabled:pointer-events-none disabled:opacity-20"><ChevronLeft size={21} /></button>
      <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === pages.length - 1} aria-label="Pagina următoare" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/30 bg-brand-navy/82 text-white backdrop-blur-sm transition hover:bg-brand-purple disabled:pointer-events-none disabled:opacity-20"><ChevronRight size={21} /></button>
      {!large && <button type="button" onClick={() => setExpanded(true)} aria-label="Mărește mostra" className="absolute right-2 top-2 grid h-10 w-10 place-items-center border border-white/30 bg-brand-navy/82 text-white backdrop-blur-sm transition hover:bg-brand-purple"><Maximize2 size={17} /></button>}
    </div>
  );

  return (
    <section className={`overflow-hidden px-4 py-14 sm:px-6 md:py-20 ${isNight ? "bg-[#f7f0df] text-brand-navy" : "bg-brand-navy text-brand-cream"}`} aria-labelledby={`${product}-sample-title`}>
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${isNight ? "text-brand-purple" : "text-brand-gold"}`}><Sparkles size={16} /> {eyebrow}</p>
          <h2 id={`${product}-sample-title`} className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
          <p className={`mt-5 text-base font-semibold leading-relaxed sm:text-lg ${isNight ? "text-brand-navy/68" : "text-brand-cream/72"}`}>{description}</p>
          <div className={`mt-7 grid gap-3 border-y py-5 text-sm font-bold sm:grid-cols-2 ${isNight ? "border-brand-navy/15 text-brand-navy/72" : "border-white/15 text-brand-cream/72"}`}>
            {facts.map((fact) => <span key={fact} className="flex items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 ${isNight ? "bg-brand-purple" : "bg-brand-gold"}`} />{fact}</span>)}
          </div>
          <div className="mt-7">
            <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${isNight ? "text-brand-purple" : "text-brand-gold"}`}>{activePage.eyebrow}</p>
            <h3 className="mt-2 font-serif text-2xl">{activePage.title}</h3>
            <p className={`mt-2 text-sm font-semibold leading-relaxed ${isNight ? "text-brand-navy/62" : "text-brand-cream/62"}`}>{activePage.description}</p>
          </div>
          <a href={ctaHref} className={`mt-7 inline-flex min-h-12 items-center px-6 text-sm font-black transition ${isNight ? "bg-brand-navy text-brand-cream hover:bg-brand-purple" : "bg-brand-gold text-brand-navy hover:bg-brand-cream"}`}>{ctaLabel}<ChevronRight className="ml-2" size={18} /></a>
        </div>

        <div>
          {pagePreview()}
          <div className="mx-auto mt-5 grid max-w-[520px] grid-cols-3 gap-2" aria-label="Alege pagina din mostră">
            {pages.map((page, index) => (
              <button key={page.image} type="button" onClick={() => goTo(index)} aria-label={`Arată ${page.title}`} aria-current={activeIndex === index ? "page" : undefined} className={`relative aspect-[.95] overflow-hidden border bg-white transition ${activeIndex === index ? "border-brand-gold ring-2 ring-brand-gold" : "border-brand-navy/15 opacity-65 hover:opacity-100"}`}>
                <Image src={page.image} alt="" fill sizes="170px" className="object-cover object-top" />
              </button>
            ))}
          </div>
          <div className={`mx-auto mt-4 flex max-w-[520px] items-center justify-between border-t pt-4 text-xs font-black ${isNight ? "border-brand-navy/12 text-brand-navy/55" : "border-white/12 text-brand-cream/55"}`}><span>Răsfoiește produsul real</span><span className="tabular-nums">{activeIndex + 1} / {pages.length}</span></div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[20000] flex flex-col bg-[#080f21]/96 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label={`${activePage.title}, mărit`} onClick={() => setExpanded(false)}>
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-white/15 pb-3 text-white" onClick={(event) => event.stopPropagation()}>
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-gold">{activePage.eyebrow}</p><p className="mt-1 font-serif text-xl sm:text-2xl">{activePage.title}</p></div>
              <button type="button" onClick={() => setExpanded(false)} aria-label="Închide mostra" className="grid h-11 w-11 place-items-center border border-white/25 transition hover:bg-white/10"><X size={21} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center py-4" onClick={(event) => event.stopPropagation()}>{pagePreview(true)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
