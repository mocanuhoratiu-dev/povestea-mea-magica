"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookHeart, Check, MoonStar, PackageCheck, TimerReset } from "lucide-react";
import { commerce } from "@/lib/siteMode";
import PremiumBookMockup from "@/components/PremiumBookMockup";

const products = [
  {
    eyebrow: "Produsul-fanion",
    title: "Povestea Magică",
    description: "O carte ilustrată în care copilul tău este eroul. Chipul, lumea, companionii și detaliile familiei schimbă cu adevărat aventura.",
    features: ["16 pagini A5, format orizontal", "13 ilustrații create pentru poveste", "Previzualizare personalizată înainte de plată", "Audio și caiet de activități inclus"],
    image: "/examples/album/coperta.webp",
    visual: "book",
    href: "/povestea-magica",
    cta: "Descoperă Povestea Magică",
    price: commerce.prices.illustratedAlbum,
    icon: BookHeart,
    tone: "navy",
  },
  {
    eyebrow: "Pentru nopțile cu emoții",
    title: "Scutul de Noapte",
    description: "Un joc magic și personalizat, cu certificat și rețetă imaginară, urmat de pași blânzi și repere familiare înainte de somn.",
    features: ["Certificat, rețetă și etichete", "Poveste, fișa «Camera mea» și respirație", "Card de noptieră, calendar și audio Lumi"],
    image: "/examples/scut/certificat-display.webp",
    visual: "paper",
    href: "/scutul-de-noapte",
    cta: "Construiește Scutul",
    price: commerce.prices.nightShield,
    icon: MoonStar,
    tone: "gold",
  },
  {
    eyebrow: "Pentru timpul de așteptare",
    title: "Trusa de Răbdare",
    description: "Un caiet printabil cu misiuni potrivite locului, vârstei și lucrurilor care îl captivează pe copil.",
    features: ["10 pagini A4, 8 activități", "Labirint și diferențe validate", "Cartonașe și 3 niveluri"],
    image: "/examples/trusa-premium/page-1-display.webp",
    visual: "paper",
    href: "/trusa-de-rabdare",
    cta: "Pregătește Trusa",
    price: commerce.prices.patienceKit,
    icon: TimerReset,
    tone: "orange",
  },
] as const;

export default function ProductExamples() {
  return (
    <section id="colectia" className="bg-brand-cream px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 border-b border-brand-navy/15 pb-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-purple">Colecția Povestea Mea Magică</p>
            <h2 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy sm:text-5xl">Trei momente. O lume creată pentru copilul tău.</h2>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">Fiecare produs pornește de la o nevoie reală a familiei și se transformă într-un material pe care îl puteți citi, folosi și păstra împreună.</p>
        </div>

        <div className="divide-y divide-brand-navy/15">
          {products.map((product, index) => {
            const Icon = product.icon;
            const dark = product.tone === "navy";
            return (
              <motion.article key={product.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.08 }} className={`grid gap-0 py-10 lg:grid-cols-2 lg:py-16 ${index % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className={`relative flex min-h-[330px] items-center justify-center overflow-hidden px-5 py-7 sm:min-h-[460px] sm:px-8 ${product.tone === "navy" ? "bg-[#e8e1d4]" : "bg-brand-navy"}`}>
                  {product.visual === "book" ? (
                    <PremiumBookMockup src={product.image} alt={`Model complet pentru ${product.title}`} sizes="(min-width: 1024px) 46vw, 94vw" className="max-w-[680px]" />
                  ) : (
                    <div className="relative aspect-[.707] h-auto w-[58%] max-w-[300px] border border-brand-gold/45 bg-white shadow-[16px_22px_44px_rgba(3,10,24,.38)] sm:w-[54%]">
                      <Image src={product.image} alt={`Coperta completă pentru ${product.title}`} fill sizes="(min-width: 1024px) 25vw, 58vw" className="object-contain" />
                      <div aria-hidden="true" className="absolute -bottom-2 -right-2 left-2 top-2 -z-10 border border-brand-gold/30 bg-brand-cream" />
                    </div>
                  )}
                </div>
                <div className={`flex flex-col justify-center px-6 py-9 sm:px-10 lg:px-14 ${dark ? "bg-brand-navy text-brand-cream" : product.tone === "gold" ? "bg-[#f2e5bd] text-brand-navy" : "bg-white text-brand-navy"}`}>
                  <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${dark ? "text-brand-gold" : product.tone === "orange" ? "text-brand-orange" : "text-brand-purple"}`}><Icon size={18} /> {product.eyebrow}</div>
                  <h3 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{product.title}</h3>
                  <p className={`mt-5 max-w-xl text-base font-semibold leading-relaxed ${dark ? "text-brand-cream/72" : "text-brand-navy/68"}`}>{product.description}</p>
                  <ul className={`mt-7 grid gap-3 border-y py-5 text-sm font-bold sm:grid-cols-2 ${dark ? "border-brand-cream/15 text-brand-cream/78" : "border-brand-navy/12 text-brand-navy/75"}`}>
                    {product.features.map((feature) => <li key={feature} className="flex gap-2"><Check size={16} className={`mt-0.5 shrink-0 ${dark ? "text-brand-gold" : "text-brand-purple"}`} />{feature}</li>)}
                  </ul>
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <p className={`font-nunito text-3xl font-black ${dark ? "text-brand-gold" : "text-brand-navy"}`}>{product.price}</p>
                    <Link href={product.href} className={`inline-flex min-h-12 items-center gap-2 px-5 text-sm font-black transition-colors ${dark ? "bg-brand-gold text-brand-navy hover:bg-brand-cream" : "bg-brand-navy text-brand-cream hover:bg-brand-purple"}`}>{product.cta}<ArrowRight size={17} /></Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
        <div className="grid gap-7 border-y border-brand-gold/55 bg-brand-navy px-7 py-9 text-brand-cream md:grid-cols-[auto_1fr_auto] md:items-center md:px-10">
          <PackageCheck size={36} className="text-brand-gold" />
          <div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-gold">Pachetul Complet</p><h3 className="mt-2 font-serif text-3xl">Toate cele trei produse, personalizate separat</h3><p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-brand-cream/70">Patru PDF-uri pentru poveste, joacă, seară și așteptare. Valoare individuală 97 lei.</p></div>
          <div className="md:text-right"><p className="font-nunito text-4xl font-black text-brand-gold">{commerce.prices.completeBundle}</p><Link href="/pachet-complet" className="mt-4 inline-flex min-h-11 items-center gap-2 bg-brand-gold px-5 text-sm font-black text-brand-navy transition-colors hover:bg-brand-cream">Alege pachetul<ArrowRight size={16} /></Link></div>
        </div>
      </div>
    </section>
  );
}
