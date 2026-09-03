import type { Metadata } from "next";
import AlbumCreator, { AlbumPrintTeaser } from "@/components/AlbumCreator";
import AlbumFlipbook from "@/components/AlbumFlipbook";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";

export const metadata: Metadata = {
  title: "Albumul Meu Magic | Poveste ilustrată personalizată",
  description: "Creează o carte ilustrată premium A5 landscape, cu 13 scene 2K și un caiet inclus cu trei activități pentru copilul tău.",
  alternates: { canonical: "/album-ilustrat" },
  openGraph: {
    url: "/album-ilustrat",
    title: "Albumul Meu Magic | Povestea Mea Magică",
    description: "13 ilustrații 2K, o poveste construită din ideea familiei și un caiet separat cu trei activități.",
    images: ["/examples/album/coperta.webp"],
  },
};

export default function IllustratedAlbumPage() {
  return (
    <main className="min-h-screen bg-brand-cream pt-16 md:pt-24">
      <section className="px-5 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14">
        <div className="mx-auto max-w-7xl border-b border-brand-navy/15 pb-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Album ilustrat premium</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><h1 className="max-w-4xl font-nunito text-4xl font-black leading-tight text-brand-navy sm:text-5xl md:text-6xl">Albumul Meu Magic</h1><p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">O carte ilustrată construită în jurul copilului tău: personaj consecvent, 13 scene 2K, text așezat separat de imagine și un caiet inclus cu trei activități.</p></div>
            <p className="font-nunito text-4xl font-black text-brand-purple">59 lei</p>
          </div>
        </div>
      </section>
      <AlbumFlipbook />
      <section id="configureaza-albumul" className="scroll-mt-20 px-0 py-12 sm:px-6 md:py-20">
        <div className="mx-auto mb-8 max-w-7xl px-5 sm:px-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Acum este rândul poveștii voastre</p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-brand-navy sm:text-4xl">Construiește aventura copilului tău.</h2>
        </div>
        <div className="mx-auto max-w-7xl"><AlbumCreator /></div>
      </section>
      <AlbumPrintTeaser />
      <Footer />
      <LumiGuideLoader />
    </main>
  );
}
