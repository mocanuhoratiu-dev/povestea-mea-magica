"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, Pause, Play, Sparkles, Volume2, X } from "lucide-react";
import { albumSampleAudio, albumSamplePages } from "@/lib/album/sample";
import { playStaticNarration, stopNarration, subscribeToNarration } from "@/lib/narrationPlayback";
import { trackEvent } from "@/lib/clientTelemetry";

const narrationOwner = "album-public-sample";
const narratedPageIndexes = albumSamplePages.flatMap((page, index) => page.narration ? [index] : []);

function AlbumPage({ index, priority = false }: { index: number; priority?: boolean }) {
  const page = albumSamplePages[index];

  return (
    <div className="relative aspect-[1.419] w-full overflow-hidden bg-[#f6eddc]">
      <Image
        src={page.image}
        alt={page.alt}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 1120px, (min-width: 768px) 88vw, 96vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[3%] bg-gradient-to-r from-brand-navy/18 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/50" />
    </div>
  );
}

export default function AlbumFlipbook() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [narrationPhase, setNarrationPhase] = useState<"idle" | "loading" | "playing">("idle");
  const [audioProgress, setAudioProgress] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const viewedPages = useRef(new Set<number>());
  const reduceMotion = useReducedMotion();
  const page = albumSamplePages[activeIndex];

  const goTo = useCallback((index: number, nextDirection?: number) => {
    const bounded = Math.max(0, Math.min(albumSamplePages.length - 1, index));
    setDirection(nextDirection ?? (bounded >= activeIndex ? 1 : -1));
    setActiveIndex(bounded);
  }, [activeIndex]);

  const goPrevious = useCallback(() => goTo(activeIndex - 1, -1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1, 1), [activeIndex, goTo]);

  useEffect(() => {
    const unsubscribe = subscribeToNarration((state) => {
      if (state.owner === narrationOwner) setNarrationPhase(state.phase);
      else setNarrationPhase("idle");
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    [activeIndex - 1, activeIndex + 1].forEach((index) => {
      const nextPage = albumSamplePages[index];
      if (!nextPage) return;
      const preload = new window.Image();
      preload.src = nextPage.image;
    });
  }, [activeIndex]);

  useEffect(() => {
    if (viewedPages.current.has(activeIndex)) return;
    viewedPages.current.add(activeIndex);
    trackEvent("album_sample_page_viewed", { product: "album", samplePage: activeIndex + 1 });
  }, [activeIndex]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [expanded]);

  useEffect(() => () => stopNarration(narrationOwner), []);

  const toggleNarration = () => {
    if (narrationPhase === "playing" || narrationPhase === "loading") {
      setAudioProgress(0);
      stopNarration(narrationOwner);
      return;
    }
    trackEvent("album_sample_audio_played", { product: "album", samplePage: activeIndex + 1 });
    setAudioProgress(0);
    goTo(narratedPageIndexes[0], 1);
    void playStaticNarration(narrationOwner, albumSampleAudio, {
      onProgress: (progress) => {
        setAudioProgress(progress);
        const scene = Math.min(narratedPageIndexes.length - 1, Math.floor(progress * narratedPageIndexes.length));
        setDirection(1);
        setActiveIndex(narratedPageIndexes[scene]);
      },
      onEnded: () => setAudioProgress(0),
      onError: () => setAudioProgress(0),
    }).catch(() => setAudioProgress(0));
  };

  const pageMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, rotateY: direction > 0 ? -11 : 11, x: direction > 0 ? 34 : -34 },
        animate: { opacity: 1, rotateY: 0, x: 0 },
        exit: { opacity: 0, rotateY: direction > 0 ? 9 : -9, x: direction > 0 ? -22 : 22 },
      };

  const book = (isExpanded = false) => (
    <div
      className={`relative mx-auto w-full outline-none ${isExpanded ? "max-w-none" : "max-w-[1120px]"}`}
      role="group"
      aria-label={`Povestea Magică a Evei, pagina ${activeIndex + 1} din ${albumSamplePages.length}`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goPrevious();
        if (event.key === "ArrowRight") goNext();
        if (event.key === "Home") goTo(0, -1);
        if (event.key === "End") goTo(albumSamplePages.length - 1, 1);
      }}
      onPointerDown={(event) => { pointerStart.current = event.clientX; }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (distance > 54) goPrevious();
        if (distance < -54) goNext();
      }}
    >
      <p className="sr-only" aria-live="polite">Pagina {activeIndex + 1}: {page.title}</p>
      <div className="relative overflow-hidden border border-brand-gold/45 bg-brand-navy shadow-[0_28px_80px_rgba(4,10,25,0.42)]" style={{ perspective: "1800px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page.image}
            {...pageMotion}
            transition={{ duration: reduceMotion ? 0.12 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: direction > 0 ? "left center" : "right center", transformStyle: "preserve-3d" }}
          >
            <AlbumPage index={activeIndex} priority={activeIndex < 2} />
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          onClick={goPrevious}
          disabled={activeIndex === 0}
          aria-label="Pagina anterioară"
          className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/30 bg-brand-navy/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-brand-purple disabled:pointer-events-none disabled:opacity-25 sm:left-4 sm:h-12 sm:w-12"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex === albumSamplePages.length - 1}
          aria-label="Pagina următoare"
          className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/30 bg-brand-navy/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-brand-purple disabled:pointer-events-none disabled:opacity-25 sm:right-4 sm:h-12 sm:w-12"
        >
          <ChevronRight size={24} />
        </button>
        {!isExpanded && (
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              trackEvent("album_sample_expanded", { product: "album", samplePage: activeIndex + 1 });
            }}
            aria-label="Mărește povestea"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center border border-white/30 bg-brand-navy/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-brand-purple sm:right-4 sm:top-4"
          >
            <Maximize2 size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <section className="overflow-hidden bg-brand-navy px-4 py-14 text-brand-cream sm:px-6 md:py-20" aria-labelledby="album-sample-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,.72fr)_minmax(460px,1.28fr)] lg:items-end lg:gap-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-gold"><Sparkles size={16} /> O carte adevărată, pagină cu pagină</div>
            <h2 id="album-sample-title" className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Intră în Povestea Magică a Evei.</h2>
            <p className="mt-5 text-base font-semibold leading-relaxed text-brand-cream/72 sm:text-lg">Răsfoiește toate cele 16 pagini ale poveștii Evei. Fiecare comandă primește o aventură nouă, construită din alegerile familiei.</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-brand-cream/72">
              <span className="inline-flex items-center gap-2"><BookOpen size={17} className="text-brand-gold" /> 16 pagini A5, format orizontal</span>
              <span className="inline-flex items-center gap-2"><Volume2 size={17} className="text-brand-gold" /> Narațiune în română</span>
            </div>
          </div>
          <div className="hidden items-center justify-end gap-2 text-xs font-bold text-brand-cream/55 lg:flex"><ChevronLeft size={15} /> Folosește săgețile sau tastele pentru a răsfoi <ChevronRight size={15} /></div>
        </div>

        <div className="mt-9 md:mt-12">
          {book()}
          <div className="mx-auto mt-5 max-w-[1120px]">
            <div className="flex flex-col gap-4 border-y border-white/12 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-gold">{page.eyebrow}</p>
                <p className="mt-1 font-serif text-xl leading-tight text-brand-cream sm:text-2xl">{page.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={toggleNarration}
                  className="inline-flex min-h-11 items-center gap-2 border border-brand-gold/55 bg-brand-gold px-4 text-sm font-black text-brand-navy transition hover:bg-brand-cream"
                >
                  {narrationPhase === "loading" ? <span className="h-4 w-4 animate-spin border-2 border-brand-navy/25 border-t-brand-navy" /> : narrationPhase === "playing" ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                  {narrationPhase === "loading" ? "Pregătim vocea" : narrationPhase === "playing" ? "Oprește" : "Ascultă povestea"}
                </button>
                <p className="w-[76px] text-right text-sm font-black tabular-nums text-brand-cream">{activeIndex + 1} / {albumSamplePages.length}</p>
              </div>
            </div>
            <div className="mt-3 h-1 overflow-hidden bg-white/12" aria-hidden="true"><div className="h-full bg-brand-gold transition-[width] duration-200" style={{ width: `${audioProgress * 100}%` }} /></div>
            <div className="mt-4 flex gap-1.5" aria-label="Alege pagina">
              {albumSamplePages.map((samplePage, index) => (
                <button
                  key={samplePage.image}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Pagina ${index + 1}: ${samplePage.title}`}
                  aria-current={activeIndex === index ? "page" : undefined}
                  className={`h-2 min-w-0 flex-1 transition-colors ${activeIndex === index ? "bg-brand-gold" : index < activeIndex ? "bg-brand-purple-light/70" : "bg-white/18 hover:bg-white/35"}`}
                />
              ))}
            </div>
            <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-white/12 pt-7 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm font-semibold leading-relaxed text-brand-cream/65">Acesta este un exemplu complet. Povestea, personajul, lumea și ilustrațiile cărții voastre vor fi create separat pentru copilul vostru.</p>
              <Link href="/povestea-magica#configureaza-albumul" onClick={() => trackEvent("album_sample_cta_clicked", { product: "album", samplePage: activeIndex + 1 })} className="inline-flex min-h-12 shrink-0 items-center gap-2 bg-brand-cream px-6 text-sm font-black text-brand-navy transition hover:bg-brand-gold">Creează povestea <ChevronRight size={18} /></Link>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] flex flex-col bg-[#0b1428]/96 p-3 backdrop-blur-md sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label={`Povestea Evei, pagina ${activeIndex + 1} din ${albumSamplePages.length}`}
            onClick={() => setExpanded(false)}
          >
            <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-b border-white/15 pb-3" onClick={(event) => event.stopPropagation()}>
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-gold">{page.eyebrow}</p><p className="mt-1 font-serif text-lg text-white sm:text-2xl">{page.title}</p></div>
              <button type="button" onClick={() => setExpanded(false)} aria-label="Închide povestea mărită" className="grid h-11 w-11 place-items-center border border-white/25 text-white transition hover:bg-white/10"><X size={21} /></button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center py-4" onClick={(event) => event.stopPropagation()}>
              <div className="w-[min(96vw,calc((100dvh-9rem)*1.419))] max-w-[1400px]">{book(true)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
