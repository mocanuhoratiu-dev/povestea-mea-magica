import type { Metadata } from "next";
import AlbumCreator, { AlbumPrintTeaser } from "@/components/AlbumCreator";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";

export const metadata: Metadata = {
  title: "Albumul Meu Magic | Poveste ilustrată personalizată",
  description: "Creează o carte ilustrată personalizată A5 landscape și un caiet separat cu activități pentru copilul tău.",
  alternates: { canonical: "/album-ilustrat" },
  openGraph: {
    url: "/album-ilustrat",
    title: "Albumul Meu Magic | Povestea Mea Magică",
    description: "13 ilustrații unice, o poveste personalizată și un caiet separat cu activități.",
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
            <div><h1 className="max-w-4xl font-nunito text-4xl font-black leading-tight text-brand-navy sm:text-5xl md:text-6xl">Albumul Meu Magic</h1><p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">O poveste vizuală în care copilul apare în fiecare etapă a aventurii, alături de un caiet separat pentru joacă și colorat.</p></div>
            <p className="font-nunito text-4xl font-black text-brand-purple">59 lei</p>
          </div>
        </div>
      </section>
      <section className="px-0 sm:px-6"><div className="mx-auto max-w-7xl"><AlbumCreator /></div></section>
      <AlbumPrintTeaser />
      <Footer />
      <LumiGuideLoader />
    </main>
  );
}

