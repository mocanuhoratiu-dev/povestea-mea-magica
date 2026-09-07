"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TelemetryProduct } from "@/lib/telemetry";
import { trackEvent } from "@/lib/clientTelemetry";

type ProductWalkthroughVideoProps = {
  product: TelemetryProduct;
  eyebrow: string;
  title: string;
  description: string;
  src: string;
  poster: string;
  tone: "night" | "day";
};

export default function ProductWalkthroughVideo({ product, eyebrow, title, description, src, poster, tone }: ProductWalkthroughVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [allowAutoplay, setAllowAutoplay] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      const canAutoplay = window.matchMedia("(min-width: 1024px)").matches
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        && !connection?.saveData;
      setAllowAutoplay(canAutoplay);
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "200px 0px", threshold: 0.01 });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad || !allowAutoplay) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [allowAutoplay, shouldLoad]);

  const onPlay = () => {
    setPlaying(true);
    if (!tracked.current) {
      tracked.current = true;
      trackEvent("product_video_played", { product });
    }
  };

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!shouldLoad) {
      setShouldLoad(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    if (video.paused) void video.play(); else video.pause();
  };

  const dark = tone === "night";
  return (
    <section className={`${dark ? "bg-[#09132c] text-brand-cream" : "bg-[#f1e7d5] text-brand-navy"} px-4 py-12 sm:px-6 md:py-24`}>
      <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-14">
        <div className="order-2 max-w-xl lg:order-1">
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${dark ? "text-brand-gold" : "text-brand-purple"}`}>{eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-5xl">{title}</h2>
          <p className={`mt-5 text-base font-semibold leading-relaxed sm:text-lg ${dark ? "text-brand-cream/75" : "text-brand-navy/75"}`}>{description}</p>
          <div className={`mt-7 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 border-t pt-5 text-center text-[10px] font-black uppercase tracking-[0.08em] sm:flex sm:gap-3 sm:text-xs ${dark ? "border-white/15 text-brand-cream/72" : "border-brand-navy/15 text-brand-navy/72"}`}>
            <span>Personalizezi</span><span aria-hidden="true">→</span><span>Printezi</span><span aria-hidden="true">→</span><span>Folosiți împreună</span>
          </div>
        </div>
        <div ref={containerRef} className="relative order-1 aspect-video w-full overflow-hidden bg-brand-navy shadow-[0_22px_55px_rgba(12,20,42,.22)] lg:order-2 lg:shadow-[0_30px_80px_rgba(12,20,42,.25)]">
          <video ref={videoRef} src={shouldLoad ? src : undefined} poster={poster} autoPlay={allowAutoplay} loop muted playsInline preload={shouldLoad ? "metadata" : "none"} onPlay={onPlay} onPause={() => setPlaying(false)} className="h-full w-full object-cover" aria-label={`Prezentare video ${title}`} />
          <button type="button" onClick={() => void toggle()} className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center border border-white/35 bg-brand-navy/78 text-white backdrop-blur-sm transition hover:bg-brand-purple" aria-label={playing ? "Pauză video" : "Redă video"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        </div>
      </div>
    </section>
  );
}
