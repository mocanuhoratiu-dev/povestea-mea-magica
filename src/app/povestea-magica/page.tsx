import type { Metadata } from "next";
import Image from "next/image";
import AlbumCreator, { AlbumPrintTeaser } from "@/components/AlbumCreator";
import AlbumFlipbook from "@/components/AlbumFlipbook";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import LumiOpenButton from "@/components/LumiOpenButton";

export const metadata: Metadata = {
  title: "Povestea Magică | Carte ilustrată personalizată",
  description: "Creează o poveste ilustrată premium A5 în format orizontal, cu personaj consecvent din descriere sau fotografie, 13 scene, audio și activități.",
  alternates: { canonical: "/povestea-magica" },
  openGraph: { url: "/povestea-magica", title: "Povestea Magică | Povestea Mea Magică", images: ["/examples/album/coperta.webp"] },
};

export default function MagicalStoryPage() {
  return (
    <main className="min-h-screen bg-brand-cream pt-16 md:pt-24">
      <section className="px-5 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
        <div className="mx-auto grid max-w-7xl gap-8 border-b border-brand-navy/15 pb-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-purple">Cartea copilului tău</p>
            <h1 className="mt-4 font-nunito text-5xl font-black leading-[1.02] text-brand-navy sm:text-6xl md:text-7xl">Povestea<br /><span className="text-brand-purple">Magică</span></h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">O aventură ilustrată construită în jurul copilului tău. Îi păstrăm chipul, ținuta și micile detalii recognoscibile de la copertă până la ultima pagină.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#configureaza-albumul" className="inline-flex min-h-12 items-center bg-brand-navy px-6 text-sm font-black text-brand-cream">Completez singur</a>
              <LumiOpenButton className="inline-flex min-h-12 items-center gap-2 border border-brand-purple px-6 text-sm font-black text-brand-purple" />
            </div>
          </div>
          <div className="relative aspect-[1.419] overflow-hidden border border-brand-gold/55 bg-brand-navy shadow-[0_28px_70px_rgba(36,50,79,.2)]"><Image src="/examples/album/coperta.webp" alt="Coperta modelului Povestea Magică" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /></div>
        </div>
      </section>
      <AlbumFlipbook />
      <section id="configureaza-albumul" className="scroll-mt-20 px-0 py-12 sm:px-6 md:py-20">
        <div className="mx-auto mb-8 max-w-7xl px-5 sm:px-0"><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Acum este rândul poveștii voastre</p><h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-brand-navy sm:text-4xl">Construiește aventura copilului tău.</h2></div>
        <div className="mx-auto max-w-7xl"><AlbumCreator /></div>
      </section>
      <AlbumPrintTeaser />
      <Footer />
      <LumiGuideLoader />
    </main>
  );
}
