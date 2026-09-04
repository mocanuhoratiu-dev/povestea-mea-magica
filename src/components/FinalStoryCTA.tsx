"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalStoryCTA() {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden bg-brand-navy px-5 py-20 text-brand-cream sm:px-6 md:min-h-[620px]" aria-labelledby="final-cta-title">
      <Image
        src="/examples/album/hero-v2.webp"
        alt="O fetiță într-o lume luminată de stele"
        fill
        sizes="100vw"
        className="object-cover object-[68%_50%] opacity-68 sm:object-center"
      />
      <div className="absolute inset-0 bg-brand-navy/62" />
      <div className="relative mx-auto flex min-h-[400px] max-w-7xl items-center justify-center text-center md:min-h-[460px]">
        <div className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-gold">O singură poveste. Un singur erou.</p>
          <h2 id="final-cta-title" className="mt-5 font-nunito text-4xl font-black leading-tight sm:text-5xl md:text-7xl">Povestea lor începe cu lucrurile pe care doar voi le știți.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-relaxed text-brand-cream/80 sm:text-lg">Spune-ne cine este copilul tău, ce iubește și în ce lume ar vrea să intre. De restul ne ocupăm noi.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/povestea-magica#configureaza-albumul" className="inline-flex min-h-14 items-center justify-center gap-3 bg-brand-gold px-7 text-base font-black text-brand-navy transition-colors hover:bg-brand-cream">
              Creează Povestea Magică <ArrowRight size={19} />
            </Link>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("pmm:lumi-open"))} className="inline-flex min-h-14 items-center justify-center gap-3 border border-brand-cream/55 px-7 text-base font-black text-brand-cream transition-colors hover:border-brand-gold hover:text-brand-gold">
              <Sparkles size={18} /> Creează cu Lumi
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
