"use client";

import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { isProductionMode } from "@/lib/siteMode";

const products = [
  {
    name: "Poveste PDF",
    price: "29 lei",
    oldPrice: "34,90 lei",
    description: "Poveste personalizată cu nume, vârstă, lume, lecție și detalii despre copil.",
    href: "#creator",
    cta: "Creează povestea",
    accent: "border-brand-purple",
    badge: "Cel mai iubit",
    features: ["Copertă ilustrată", "Text editabil înainte de PDF", "Descărcare locală"],
  },
  {
    name: "Scut Magic",
    price: "19 lei",
    oldPrice: "24,90 lei",
    description: "Kit printabil pentru frici de noapte, cu certificat, ritual și etichete de spray magic.",
    href: "#monster-away",
    cta: "Creează scutul",
    accent: "border-brand-gold",
    badge: "Pentru seară",
    features: ["Certificat oficial", "Rețetă simbolică", "Etichete pentru flacon"],
  },
  {
    name: "Trusa Urgență",
    price: "19 lei",
    oldPrice: "24,90 lei",
    description: "Activități rapide pentru restaurant, drum, doctor, casă, aeroport sau stat la coadă.",
    href: "#emergency-kit",
    cta: "Creează trusa",
    accent: "border-orange-400",
    badge: "Practic",
    features: ["6 pagini PDF", "Misiuni de răbdare", "Diplomă inclusă"],
  },
];

export default function Pricing() {
  return (
    <section id="preturi" className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-purple/10 px-5 py-2 text-sm font-black uppercase tracking-widest text-brand-purple">
            <Sparkles size={16} /> Prețuri de lansare
          </div>
          <h2 className="mt-5 font-nunito text-4xl md:text-5xl font-extrabold text-brand-navy">
            Alege materialul potrivit pentru copilul tău
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/65">
            Prețurile de mai jos sunt pregătite pentru activarea checkout-ului. Până atunci, poți genera și verifica materialele în browser.
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
                <span className="pb-2 text-sm font-black text-brand-navy/35 line-through">{product.oldPrice}</span>
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
                {isProductionMode ? product.cta : "Testează în browser"}
              </a>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border-2 border-brand-purple/15 bg-brand-purple/5 p-6 text-center">
          <p className="font-nunito text-2xl font-black text-brand-navy">
            Pachet recomandat: toate cele 3 materiale la <span className="text-brand-purple">49 lei</span>
          </p>
          <p className="mt-2 text-sm font-bold text-brand-navy/55">
            Bundle-ul devine oferta principală când activăm Stripe și livrarea automată.
          </p>
        </div>
      </div>
    </section>
  );
}
