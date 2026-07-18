"use client";

import { motion } from "framer-motion";
import { FileCheck2, HeartHandshake, Sparkles, Star } from "lucide-react";

const benefits = [
  {
    title: "Personalizare reală",
    detail: "Nume, vârstă, lume și detalii ale copilului",
    text: "Fiecare material pornește de la alegerile părintelui, astfel încât copilul să simtă că povestea sau misiunea este despre el.",
    icon: Sparkles,
    accent: "text-brand-pink border-brand-pink",
  },
  {
    title: "PDF-uri gata de folosit",
    detail: "Editare, verificare și descărcare locală",
    text: "Părintele poate verifica textul, ajusta povestea și descărca un material printabil fără pași tehnici complicați.",
    icon: FileCheck2,
    accent: "text-brand-purple border-brand-purple",
  },
  {
    title: "Ajutor în momente concrete",
    detail: "Somn, frici de noapte și așteptări lungi",
    text: "Produsele sunt gândite pentru situații reale din viața de părinte: seara, la drum, la restaurant sau în sala de așteptare.",
    icon: HeartHandshake,
    accent: "text-brand-blue border-brand-blue",
  },
];

export default function Reviews() {
  return (
    <section id="recenzii" className="py-24 bg-brand-cream relative overflow-hidden">
      {/* Playful background icons */}
      <div className="absolute top-10 left-10 text-brand-pink/10 -rotate-12">
        <Star size={100} fill="currentColor" />
      </div>
      <div className="absolute bottom-10 right-10 text-brand-blue/10 rotate-12">
        <Star size={120} fill="currentColor" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1 rounded-full bg-brand-gold/20 text-brand-navy font-bold text-xs uppercase tracking-widest mb-4"
          >
            Ce promitem
          </motion.div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-5xl text-brand-navy">
            Materiale Calde, Utile și <span className="text-brand-purple">Personalizate</span>
          </h2>
          <p className="mt-4 text-brand-navy/60 text-lg max-w-2xl mx-auto font-medium">
            Direcția produsului: mai puțină improvizație în momentele grele și mai multă magie pregătită din timp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white p-10 rounded-[2rem] shadow-xl border-t-8 ${benefit.accent}`}
            >
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cream ${benefit.accent.split(" ")[0]}`}>
                <Icon size={24} strokeWidth={2.5} />
              </div>
              <h3 className="font-nunito text-2xl font-black text-brand-navy">{benefit.title}</h3>
              <p className="mt-3 text-brand-navy/80 leading-relaxed text-lg font-medium">
                {benefit.text}
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-brand-navy/5">
                <div>
                  <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-tight">{benefit.detail}</p>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
