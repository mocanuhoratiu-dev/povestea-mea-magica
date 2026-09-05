import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, Check, Headphones, Mail, Palette, ShieldCheck, Sparkles } from "lucide-react";
import AlbumCreator, { AlbumPrintTeaser } from "@/components/AlbumCreator";
import AlbumFlipbook from "@/components/AlbumFlipbook";
import AlbumProductGallery from "@/components/AlbumProductGallery";
import Footer from "@/components/Footer";
import LumiGuideLoader from "@/components/LumiGuideLoader";
import LumiOpenButton from "@/components/LumiOpenButton";
import MobileAlbumCTA from "@/components/MobileAlbumCTA";
import ProductWalkthroughVideo from "@/components/ProductWalkthroughVideo";
import Reviews from "@/components/Reviews";
import { commerce, siteUrl } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Povestea Magică | Carte ilustrată personalizată",
  description: "Creează o poveste ilustrată premium A5 în format orizontal, cu personaj consecvent din descriere sau fotografie, 13 scene, audio și activități.",
  alternates: { canonical: "/povestea-magica" },
  openGraph: {
    url: "/povestea-magica",
    title: "Povestea Magică | Carte ilustrată personalizată",
    description: "16 pagini, 13 ilustrații, audio în română, activități și mostră personalizată înainte de plată.",
    images: [{ url: "/examples/album/coperta.webp", width: 960, height: 676, alt: "Povestea Magică, carte ilustrată personalizată" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Povestea Magică | Carte ilustrată personalizată",
    description: "16 pagini, 13 ilustrații și o aventură creată în jurul copilului tău.",
    images: ["/examples/album/coperta.webp"],
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Povestea Magică - Digital",
  image: [`${siteUrl}/examples/album/coperta.webp`, `${siteUrl}/examples/album/aventura.webp`],
  description: "Carte ilustrată personalizată de 16 pagini, cu 13 ilustrații, narațiune audio în limba română și caiet separat de activități.",
  brand: { "@type": "Brand", name: "Povestea Mea Magică" },
  sku: "PMM-ALBUM-DIGITAL",
  category: "Carte digitală personalizată pentru copii",
  offers: {
    "@type": "Offer",
    url: `${siteUrl}/povestea-magica`,
    priceCurrency: "RON",
    price: "59.00",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
  },
};

export default function MagicalStoryPage() {
  return (
    <main className="min-h-screen bg-brand-cream pt-16 md:pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <section className="relative overflow-hidden px-5 pb-12 pt-9 sm:px-6 md:pb-16 md:pt-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-brand-gold/45" />
        <div className="mx-auto grid max-w-7xl gap-9 border-b border-brand-navy/15 pb-12 lg:min-h-[650px] lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-purple"><Sparkles size={16} /> Cartea copilului tău</p>
            <h1 className="mt-4 max-w-2xl font-nunito text-5xl font-black leading-[1.02] text-brand-navy sm:text-6xl md:text-7xl">Povestea<br /><span className="text-brand-purple">Magică</span></h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">O carte ilustrată construită în jurul copilului tău, cu personaj consecvent de la copertă până la ultima scenă.</p>
            <div className="mt-7 flex items-end gap-4 border-y border-brand-navy/15 py-5">
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-navy/45">Preț digital</p><p className="mt-1 font-nunito text-4xl font-black leading-none text-brand-purple">{commerce.prices.illustratedAlbum}</p></div>
              <p className="max-w-[250px] pb-0.5 text-xs font-bold leading-relaxed text-brand-navy/55">Mostra personalizată este creată înainte să plătești.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold text-brand-navy/72 sm:grid-cols-3">
              {[{ icon: BookOpen, label: "16 pagini" }, { icon: Palette, label: "13 ilustrații" }, { icon: Headphones, label: "Audio în română" }, { icon: Check, label: "Activități incluse" }, { icon: ShieldCheck, label: "Preview înainte de plată" }, { icon: Mail, label: "Livrare pe email" }].map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-brand-purple" />{label}</span>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#configureaza-albumul" className="inline-flex min-h-13 items-center bg-brand-navy px-6 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple">Creează Povestea Magică</a>
              <LumiOpenButton className="hidden min-h-13 items-center gap-2 border border-brand-purple px-6 text-sm font-black text-brand-purple transition-colors hover:bg-brand-purple hover:text-white sm:inline-flex" />
            </div>
            <a href="#recenzii" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-brand-navy/55 underline decoration-brand-gold decoration-2 underline-offset-4">Citește reacțiile primelor familii</a>
          </div>
          <div className="relative mx-auto w-full max-w-[760px] pb-6 pl-4 pt-2 [perspective:1600px] sm:pl-8">
            <div aria-hidden="true" className="absolute inset-[12%_3%_0_12%] bg-brand-navy/20 blur-2xl" />
            <div className="relative aspect-[1.419] origin-left overflow-hidden border border-brand-gold/70 bg-brand-navy shadow-[24px_32px_70px_rgba(18,27,52,.32)] [transform:rotateY(-7deg)_rotateZ(-.5deg)]"><Image src="/examples/album/coperta.webp" alt="Coperta modelului Povestea Magică" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /></div>
            <span aria-hidden="true" className="absolute bottom-[7%] left-[2.5%] top-[4%] w-4 bg-gradient-to-r from-brand-gold/75 via-brand-cream to-brand-gold/45 shadow-xl sm:left-[5%] sm:w-5" />
            <div className="absolute -bottom-2 right-0 border border-brand-gold/55 bg-brand-cream px-4 py-3 shadow-xl sm:right-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-purple">Primești pe email</p>
              <p className="mt-1 text-xs font-black text-brand-navy">Carte + caiet + audio</p>
            </div>
          </div>
        </div>
      </section>
      <AlbumProductGallery />
      <ProductWalkthroughVideo
        product="album"
        tone="day"
        eyebrow="Povestea, în câteva secunde"
        title="Vezi cum prinde viață cartea copilului tău."
        description="De la coperta personalizată la scenele ilustrate, audio și activități: o privire rapidă prin experiența pe care o primiți împreună."
        src="/videos/povestea-magica.mp4"
        poster="/examples/album/flipbook/page-01.webp"
      />
      <AlbumFlipbook />
      <section id="configureaza-albumul" className="scroll-mt-28 px-0 py-12 sm:px-6 md:py-20">
        <div className="mx-auto mb-8 max-w-7xl px-5 sm:px-0"><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Acum este rândul poveștii voastre</p><h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-brand-navy sm:text-4xl">Construiește aventura copilului tău.</h2></div>
        <div className="mx-auto max-w-7xl"><AlbumCreator /></div>
      </section>
      <Reviews />
      <AlbumPrintTeaser />
      <Footer />
      <LumiGuideLoader />
      <MobileAlbumCTA price={commerce.prices.illustratedAlbum} />
    </main>
  );
}
