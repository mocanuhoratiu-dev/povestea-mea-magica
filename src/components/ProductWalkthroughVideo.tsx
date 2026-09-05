"use client";

import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
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
  const tracked = useRef(false);
  const [playing, setPlaying] = useState(false);

  const onPlay = () => {
    setPlaying(true);
    if (!tracked.current) {
      tracked.current = true;
      trackEvent("product_video_played", { product });
    }
  };

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play(); else video.pause();
  };

  const dark = tone === "night";
  return (
    <section className={`${dark ? "bg-[#09132c] text-brand-cream" : "bg-[#f1e7d5] text-brand-navy"} px-4 py-16 sm:px-6 md:py-24`}>
      <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-14">
        <div className="max-w-xl">
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${dark ? "text-brand-gold" : "text-brand-purple"}`}>{eyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
          <p className={`mt-5 text-base font-semibold leading-relaxed sm:text-lg ${dark ? "text-brand-cream/66" : "text-brand-navy/65"}`}>{description}</p>
          <div className={`mt-7 flex items-center gap-3 border-t pt-5 text-xs font-black uppercase tracking-[0.1em] ${dark ? "border-white/15 text-brand-cream/55" : "border-brand-navy/15 text-brand-navy/52"}`}>
            <span>Personalizezi</span><span aria-hidden="true">→</span><span>Printezi</span><span aria-hidden="true">→</span><span>Folosiți împreună</span>
          </div>
        </div>
        <div className="relative aspect-video w-full overflow-hidden bg-brand-navy shadow-[0_30px_80px_rgba(12,20,42,.25)]">
          <video ref={videoRef} src={src} poster={poster} autoPlay loop muted playsInline preload="metadata" onPlay={onPlay} onPause={() => setPlaying(false)} className="h-full w-full object-cover" aria-label={`Prezentare video ${title}`} />
          <button type="button" onClick={toggle} className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center border border-white/35 bg-brand-navy/78 text-white backdrop-blur-sm transition hover:bg-brand-purple" aria-label={playing ? "Pauză video" : "Redă video"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        </div>
      </div>
    </section>
  );
}
