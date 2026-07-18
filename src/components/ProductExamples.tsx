"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import { siteCopy } from "@/lib/siteMode";

const examples = [
  {
    title: "Poveste personalizată",
    image: "/examples/poveste-contact.png",
    description: "O aventură de aproximativ patru pagini, cu copertă, dedicație și detalii alese de tine.",
    features: ["Copertă ilustrată", "Dedicație personală", "PDF pentru citit sau print"],
    price: "29 lei",
    href: "#creator",
    cta: "Creează povestea",
    icon: BookOpen,
  },
  {
    title: "Scut Magic pentru Noapte",
    image: "/examples/scut-contact.png",
    description: "Un ritual blând de seară, cu certificat, rețetă simbolică și etichete de printat.",
    features: ["Certificat personalizat", "Ritual adaptat", "Etichete pentru flacon"],
    price: "19 lei",
    href: "#monster-away",
    cta: "Creează scutul",
    icon: ShieldCheck,
  },
  {
    title: "Trusa Magică de Urgență",
    image: "/examples/trusa-contact.png",
    description: "Misiuni de joacă pentru drum, restaurant, medic sau orice moment în care timpul trece mai greu.",
    features: ["Activități adaptate locului", "Misiuni de răbdare", "Diplomă de final"],
    price: "19 lei",
    href: "#emergency-kit",
    cta: "Creează trusa",
    icon: TimerReset,
  },
];

export default function ProductExamples() {
  return (
    <section id="alege-materialul" className="bg-white py-24 px-6 scroll-mt-28">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <div className="inline-flex rounded-full bg-brand-purple/10 px-5 py-2 text-sm font-black uppercase tracking-widest text-brand-purple">
            Alege momentul
          </div>
          <h2 className="mt-5 font-nunito text-4xl md:text-5xl font-extrabold text-brand-navy">
            De ce ai nevoie azi?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/65">
            Vezi formatul real al materialelor, alege-l pe cel potrivit și mergi direct la generare.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {examples.map((example, index) => (
            <motion.article
              key={example.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex flex-col overflow-hidden rounded-lg bg-brand-cream shadow-lg border border-brand-navy/10"
            >
              <div className="relative aspect-[4/3] bg-brand-navy/5">
                <Image
                  src={example.image}
                  alt={example.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex h-full flex-col p-7">
                <div className="flex items-center gap-3 text-brand-purple">
                  <example.icon size={22} />
                  <span className="text-xs font-black uppercase tracking-widest">Model PDF real</span>
                </div>
                <h3 className="mt-4 font-nunito text-2xl font-black text-brand-navy">{example.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-brand-navy/60">{example.description}</p>
                <ul className="mt-6 space-y-2 text-sm font-bold text-brand-navy/75">
                  {example.features.map((feature) => <li key={feature}>• {feature}</li>)}
                </ul>
                <div className="mt-7 flex items-end justify-between gap-4 border-t border-brand-navy/10 pt-5">
                  <div>
                    <p className="font-nunito text-3xl font-black text-brand-purple">{example.price}</p>
                    <p className="text-xs font-bold text-brand-navy/50">la lansarea comercială</p>
                  </div>
                  <a href={example.href} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-purple">
                    {example.cta} <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm font-bold text-brand-navy/60">{siteCopy.launchAccess}</p>
      </div>
    </section>
  );
}
