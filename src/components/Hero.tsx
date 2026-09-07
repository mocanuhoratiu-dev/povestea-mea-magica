import Image from "next/image";
import { ArrowDown, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import LumiOpenButton from "@/components/LumiOpenButton";

export default function Hero() {
  return (
    <section id="home-hero" className="relative isolate min-h-[calc(100svh-1rem)] overflow-hidden bg-brand-navy px-5 pb-16 pt-20 text-brand-cream sm:px-6 md:min-h-[720px] md:pt-24 lg:min-h-[760px] lg:pt-28">
      <Image
        src="/examples/album/hero-v2.webp"
        alt="O fetiță urmând o potecă de stele în Povestea Magică"
        fill
        priority
        fetchPriority="high"
        quality={72}
        sizes="100vw"
        className="object-cover object-[64%_50%] opacity-75 sm:object-center"
      />
      <div className="absolute inset-0 bg-brand-navy/65" />
      <div className="relative mx-auto flex min-h-[calc(100svh-8rem)] max-w-7xl items-center py-7 md:min-h-[610px] lg:min-h-[640px]">
        <div className="max-w-3xl text-center lg:text-left">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-gold">O carte creată pentru un singur copil</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-nunito text-[3.15rem] font-black leading-[1.01] tracking-normal text-brand-cream sm:mt-5 sm:text-6xl md:text-8xl lg:mx-0">
            Povestea<br /><span className="text-brand-gold">Magică</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-relaxed text-brand-cream/90 sm:mt-6 sm:text-lg md:text-xl lg:mx-0">
            Copilul tău devine eroul unei aventuri ilustrate, create din chipul, lumea și micile detalii pe care doar familia voastră le cunoaște.
          </p>
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2.5 border-y border-white/20 py-3.5 text-xs font-black text-brand-cream/85 sm:mt-7 sm:py-4 lg:mx-0 lg:justify-start">
            <span className="inline-flex items-center gap-2"><BookOpen size={16} className="text-brand-gold" /> 16 pagini de poveste</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-brand-gold" /> Previzualizare înainte de plată</span>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row lg:justify-start">
            <a
              href="/povestea-magica#configureaza-albumul"
              className="inline-flex w-full items-center justify-center gap-3 bg-brand-gold px-7 py-4 text-base font-black text-brand-navy shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-colors hover:bg-brand-cream sm:w-auto"
            >
              Creează Povestea Magică <ArrowRight size={19} />
            </a>
            <a
              href="#album-sample-title"
              className="inline-flex w-full items-center justify-center gap-3 border border-brand-cream/50 px-7 py-4 text-base font-black text-brand-cream transition-colors hover:border-brand-gold hover:text-brand-gold sm:w-auto"
            >
              <BookOpen size={19} /> Răsfoiește povestea
            </a>
          </div>
          <LumiOpenButton
            label="Creează povestea împreună cu Lumi"
            className="mx-auto mt-6 inline-flex items-center gap-2 border-b border-brand-gold/70 pb-1 text-sm font-black text-brand-cream transition-colors hover:border-brand-cream hover:text-brand-gold lg:mx-0"
          />
        </div>
      </div>
      <a href="#album-sample-title" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-brand-cream/75 transition-colors hover:text-brand-gold sm:inline-flex">Privește înăuntru <ArrowDown size={15} /></a>
    </section>
  );
}
