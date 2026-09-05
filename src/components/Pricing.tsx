"use client";

import { ArrowRight, BookHeart, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { commerce } from "@/lib/siteMode";

const products = [
  {
    name: "Povestea Magică",
    price: commerce.prices.illustratedAlbum,
    description: "O carte ilustrată premium în care personajul, lumea și aventura sunt construite în jurul copilului.",
    href: "/povestea-magica",
    cta: "Creează Povestea Magică",
    accent: "border-brand-purple",
    badge: "Cel mai iubit",
    features: ["16 pagini A5, format orizontal", "Previzualizare înainte de plată", "Audio și caiet de activități"],
  },
  {
    name: "Scutul de Noapte",
    price: commerce.prices.nightShield,
    description: "Ritual personalizat de seară, cu poveste, fișa «Camera mea», respirație, ghid pentru părinte și audio Lumi.",
    href: "/scutul-de-noapte",
    cta: "Creează scutul",
    accent: "border-brand-gold",
    badge: "Pentru seară",
    features: ["Certificat, rețetă și etichete", "Poveste, fișă de desen și card", "Audio ghidat de Lumi"],
  },
  {
    name: "Trusa de Răbdare",
    price: commerce.prices.patienceKit,
    description: "Activități rapide pentru restaurant, drum, doctor, casă, aeroport sau stat la coadă.",
    href: "/trusa-de-rabdare",
    cta: "Creează trusa",
    accent: "border-orange-400",
    badge: "Practic",
    features: ["10 pagini PDF", "8 activități validate", "3 niveluri și cartonașe"],
  },
];

export default function Pricing() {
  return (
    <section id="preturi" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-purple/10 px-5 py-2 text-sm font-black uppercase tracking-widest text-brand-purple">
            <Sparkles size={16} /> Prețuri
          </div>
          <h2 className="mt-5 font-nunito text-4xl md:text-5xl font-extrabold text-brand-navy">
            Alege materialul potrivit pentru copilul tău
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/65">
            {commerce.acceptsPayments
              ? "Alegi materialul, confirmi detaliile, apoi plătești în siguranță."
              : "Plățile online se activează în curând. Până atunci, poți crea și descărca materialele fără cost."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.12fr_1fr] gap-6 items-stretch">
          {products.map((product, index) => (
            <motion.article
              key={product.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex h-full flex-col rounded-[2rem] border-4 ${product.accent} bg-brand-cream p-7 shadow-xl ${
                index === 0 ? "lg:-mt-4 lg:mb-4" : ""
              }`}
            >
              <span className="mb-5 inline-flex w-fit rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-brand-navy/55">
                {product.badge}
              </span>
              <h3 className="font-nunito text-3xl font-black text-brand-navy">{product.name}</h3>
              <p className="mt-3 min-h-[84px] text-base font-medium leading-relaxed text-brand-navy/65">
                {product.description}
              </p>

              <div className="mt-6 flex items-end gap-3">
                <span className="font-nunito text-5xl font-black text-brand-purple">{product.price}</span>
                <span className="pb-2 text-sm font-black text-brand-navy/45">preț final</span>
              </div>

              <ul className="mt-7 space-y-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-bold text-brand-navy/75">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-purple">
                      <Check size={15} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={product.href}
                className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-brand-navy px-5 py-4 text-center text-base font-black text-white shadow-lg transition-all hover:bg-brand-purple"
              >
                {product.cta}
              </a>
            </motion.article>
          ))}
        </div>
        <div className="mt-8">
          <article className="grid gap-6 bg-brand-purple px-6 py-8 text-white sm:grid-cols-[auto_1fr]">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-brand-gold text-brand-navy"><BookHeart size={26} /></span>
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-gold">Economisești 18 lei</p><h3 className="mt-2 font-serif text-3xl">Pachetul Complet</h3><p className="mt-2 text-sm font-semibold leading-relaxed text-white/75">Povestea Magică, Scutul de Noapte și Trusa de Răbdare. Patru PDF-uri personalizate, o singură plată.</p><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="font-nunito text-4xl font-black text-brand-gold">{commerce.prices.completeBundle}</p><a href="/pachet-complet" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-gold px-5 text-sm font-black text-brand-navy">Alege pachetul <ArrowRight size={16} /></a></div></div>
          </article>
        </div>
      </div>
    </section>
  );
}
