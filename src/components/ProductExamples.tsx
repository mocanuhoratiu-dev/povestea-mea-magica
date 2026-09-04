"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookHeart, Check, MoonStar, TimerReset } from "lucide-react";
import { commerce } from "@/lib/siteMode";

const products = [
  {
    eyebrow: "Produsul-fanion",
    title: "Povestea Magică",
    description: "O carte ilustrată în care copilul tău este eroul. Chipul, lumea, companionii și detaliile familiei schimbă cu adevărat aventura.",
    features: ["16 pagini A5 landscape", "13 ilustrații create pentru poveste", "Preview personalizat înainte de plată", "Audio și caiet de activități inclus"],
    image: "/examples/album/coperta.webp",
    href: "/povestea-magica",
    cta: "Descoperă Povestea Magică",
    price: commerce.prices.illustratedAlbum,
    icon: BookHeart,
    tone: "navy",
  },
  {
    eyebrow: "Pentru nopțile cu emoții",
    title: "Scutul de Noapte",
    description: "Un ritual blând și personalizat care îi oferă copilului cuvinte, pași și repere familiare înainte de somn.",
    features: ["Ritual adaptat fricii", "Formulă de curaj", "Certificat și card pentru noptieră"],
    image: "/examples/scut-contact.png",
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
    features: ["Activități pentru contextul ales", "Mai multe ritmuri și durate", "Pagini clare, economice la print"],
    image: "/examples/trusa-contact.png",
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
                <div className="relative min-h-[300px] overflow-hidden bg-brand-navy sm:min-h-[420px]">
                  <Image src={product.image} alt={`Model pentru ${product.title}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
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
      </div>
    </section>
  );
}
