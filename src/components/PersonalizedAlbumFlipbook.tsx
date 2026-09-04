"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playStaticNarration, stopNarration, subscribeToNarration } from "@/lib/narrationPlayback";

export type PersonalizedAlbumPage = {
  kind: "cover" | "dedication" | "story" | "back";
  eyebrow: string;
  title: string;
  text: string;
  signature?: string;
  imageUrl?: string;
  layout?: "cinematic" | "image-left" | "image-right";
};

export default function PersonalizedAlbumFlipbook({ pages, audioUrl, title, qualitySummary }: { pages: PersonalizedAlbumPage[]; audioUrl?: string; title: string; qualitySummary: { accepted: number; checked: number } }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [audioPhase, setAudioPhase] = useState<"idle" | "loading" | "playing">("idle");
  const [audioProgress, setAudioProgress] = useState(0);
  const touchStart = useRef<number | null>(null);
  const owner = `album-delivery-${title}`;

  const goTo = useCallback((next: number, nextDirection?: number) => {
    const bounded = Math.max(0, Math.min(pages.length - 1, next));
    setDirection(nextDirection ?? (bounded >= activeIndex ? 1 : -1));
    setActiveIndex(bounded);
  }, [activeIndex, pages.length]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration((state) => {
      if (state.owner === owner) setAudioPhase(state.phase);
      else if (state.phase === "idle") setAudioPhase("idle");
    });
    return () => { unsubscribe(); };
  }, [owner]);
  useEffect(() => () => stopNarration(owner), [owner]);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1, -1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1, 1);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [activeIndex, expanded, goTo]);

  const toggleAudio = () => {
    if (!audioUrl) return;
    if (audioPhase !== "idle") {
      stopNarration(owner);
      return;
    }
    setAudioProgress(0);
    goTo(2, 1);
    void playStaticNarration(owner, audioUrl, {
      onProgress: (progress) => {
        setAudioProgress(progress);
        goTo(Math.min(14, 2 + Math.floor(progress * 13)), 1);
      },
      onEnded: () => setAudioProgress(0),
      onError: () => setAudioProgress(0),
    }).catch(() => setAudioPhase("idle"));
  };

  const page = pages[activeIndex];
  const pageView = (large = false) => {
    const storyLayout = page.kind === "story" ? page.layout || "cinematic" : "cinematic";
    return (
      <div
        className="relative aspect-[210/148] w-full overflow-hidden bg-brand-cream text-brand-navy shadow-[0_28px_75px_rgba(4,12,29,.28)] [container-type:inline-size]"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(delta) > 45) goTo(activeIndex + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${activeIndex}-${large}`}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? "5%" : "-5%", rotateY: direction > 0 ? -5 : 5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? "-3%" : "3%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {page.kind === "cover" && <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.imageUrl} alt="Coperta albumului" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,44,.9),rgba(7,24,44,.3)_52%,transparent_76%)]" />
              <div className="absolute inset-y-0 left-0 flex w-[58%] flex-col justify-center p-[7cqw] text-brand-cream">
                <p className="text-[1.25cqw] font-black uppercase tracking-[0.16em] text-brand-gold">{page.eyebrow}</p>
                <h3 className="mt-[2cqw] font-serif text-[5.2cqw] leading-[1.04]">{page.title}</h3>
                <p className="mt-[2.3cqw] text-[1.65cqw] font-bold text-brand-cream/80">{page.text}</p>
              </div>
            </>}
            {page.kind === "dedication" && <div className="flex h-full items-center border-[1.2cqw] border-brand-gold/30 bg-brand-cream px-[12cqw] text-center"><div className="w-full"><p className="text-[1.2cqw] font-black uppercase tracking-[0.15em] text-brand-purple">{page.eyebrow}</p><h3 className="mt-[2cqw] font-serif text-[4.5cqw]">{page.title}</h3><p className="mx-auto mt-[3cqw] max-w-[70cqw] text-[1.9cqw] font-semibold leading-relaxed text-brand-navy/75">{page.text}</p>{page.signature && <p className="mt-[2.5cqw] font-serif text-[1.8cqw] italic text-brand-purple">{page.signature}</p>}</div></div>}
            {page.kind === "story" && <div className={`grid h-full ${storyLayout === "cinematic" ? "grid-rows-[62%_38%]" : storyLayout === "image-left" ? "grid-cols-[59%_41%]" : "grid-cols-[41%_59%]"}`}>
              <div className={`${storyLayout === "image-right" ? "order-2" : ""} overflow-hidden bg-brand-navy`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={page.imageUrl} alt={page.title} className="h-full w-full object-cover" />
              </div>
              <div className={`${storyLayout === "image-right" ? "order-1" : ""} flex flex-col justify-center border-brand-gold bg-brand-cream ${storyLayout === "cinematic" ? "border-t-[.55cqw] px-[6.5cqw] py-[2.3cqw]" : storyLayout === "image-left" ? "border-l-[.55cqw] px-[3.2cqw]" : "border-r-[.55cqw] px-[3.2cqw]"}`}>
                <p className="text-[1.05cqw] font-black uppercase tracking-[0.14em] text-brand-purple">{page.eyebrow}</p>
                <h3 className={`mt-[.7cqw] font-serif leading-tight ${storyLayout === "cinematic" ? "text-[2.5cqw]" : "text-[2.8cqw]"}`}>{page.title}</h3>
                <p className={`mt-[1cqw] font-semibold leading-[1.38] text-brand-navy/76 ${storyLayout === "cinematic" ? "text-[1.45cqw]" : "text-[1.55cqw]"}`}>{page.text}</p>
              </div>
            </div>}
            {page.kind === "back" && <div className="flex h-full items-center justify-center bg-brand-navy px-[12cqw] text-center text-brand-cream"><div><div className="mx-auto h-[.5cqw] w-[10cqw] bg-brand-gold" /><h3 className="mt-[4cqw] font-serif text-[4.4cqw]">{page.title}</h3><p className="mt-[2cqw] text-[1.5cqw] font-bold uppercase tracking-[0.14em] text-brand-gold">{page.text}</p></div></div>}
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-[1.5cqw] right-[2cqw] text-[1.1cqw] font-black text-brand-navy/55">{activeIndex + 1}</span>
      </div>
    );
  };

  return <section className="mb-9 border-y border-brand-navy/15 bg-brand-navy px-4 py-7 text-brand-cream sm:px-7 sm:py-9">
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-gold">Albumul vostru digital</p><p className="mt-1 text-sm font-semibold text-brand-cream/65">Răsfoiește înainte de descărcare</p></div>{qualitySummary.checked > 0 && <p className="inline-flex items-center gap-2 text-xs font-bold text-brand-cream/70"><ShieldCheck size={16} className="text-brand-gold" /> {qualitySummary.accepted}/{qualitySummary.checked} imagini verificate</p>}</div>
      {pageView()}
      <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button type="button" onClick={() => goTo(activeIndex - 1, -1)} disabled={activeIndex === 0} aria-label="Pagina anterioară" className="grid h-11 w-11 place-items-center border border-white/20 disabled:opacity-25"><ChevronLeft /></button>
        <div className="flex items-center justify-center gap-2">
          {audioUrl && <button type="button" onClick={toggleAudio} className="inline-flex min-h-11 items-center gap-2 bg-brand-gold px-4 text-xs font-black text-brand-navy">{audioPhase === "playing" ? <Pause size={16} /> : <Play size={16} fill="currentColor" />} {audioPhase === "loading" ? "Pregătim vocea" : audioPhase === "playing" ? "Oprește" : "Ascultă"}</button>}
          <button type="button" onClick={() => setExpanded(true)} className="grid h-11 w-11 place-items-center border border-white/20" aria-label="Mărește albumul"><Expand size={17} /></button>
          <span className="ml-2 text-xs font-black tabular-nums">{activeIndex + 1} / {pages.length}</span>
        </div>
        <button type="button" onClick={() => goTo(activeIndex + 1, 1)} disabled={activeIndex === pages.length - 1} aria-label="Pagina următoare" className="grid h-11 w-11 place-items-center border border-white/20 disabled:opacity-25"><ChevronRight /></button>
      </div>
      {audioUrl && <div className="mt-3 h-1 bg-white/10"><div className="h-full bg-brand-gold transition-[width]" style={{ width: `${audioProgress * 100}%` }} /></div>}
    </div>
    <AnimatePresence>{expanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[20000] flex flex-col bg-[#07182c]/96 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label={`${title}, pagina ${activeIndex + 1}`}>
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-b border-white/15 pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-gold">{page.eyebrow}</p><p className="mt-1 font-serif text-lg text-white sm:text-2xl">{page.title}</p></div><button type="button" onClick={() => setExpanded(false)} aria-label="Închide albumul mărit" className="grid h-11 w-11 place-items-center border border-white/25"><X /></button></div>
      <div className="flex min-h-0 flex-1 items-center justify-center py-4"><div className="w-[min(96vw,calc((100dvh-9rem)*1.419))] max-w-[1400px]">{pageView(true)}</div></div>
    </motion.div>}</AnimatePresence>
  </section>;
}
