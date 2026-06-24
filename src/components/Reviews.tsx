"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Personalizare reală",
    role: "Nume, vârstă, lume și detalii ale copilului",
    text: "Fiecare material pornește de la alegerile părintelui, astfel încât copilul să simtă că povestea sau misiunea este despre el.",
  },
  {
    name: "PDF-uri gata de folosit",
    role: "Previzualizare, editare și descărcare locală",
    text: "Părintele poate verifica textul, ajusta povestea și descărca un material printabil fără pași tehnici complicați.",
  },
  {
    name: "Ajutor în momente concrete",
    role: "Somn, frici de noapte și așteptări lungi",
    text: "Produsele sunt gândite pentru situații reale din viața de părinte: seara, la drum, la restaurant sau în sala de așteptare.",
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
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-white p-10 rounded-[3rem] shadow-xl border-t-8 ${
                index === 0 ? "border-brand-pink" : index === 1 ? "border-brand-purple" : "border-brand-blue"
              }`}
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-6 h-6 fill-brand-gold text-brand-gold" />
                ))}
              </div>
              <p className="text-brand-navy/80 italic mb-8 leading-relaxed text-lg font-medium">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-brand-navy/5">
                <div>
                  <h4 className="font-black text-brand-navy text-lg">{t.name}</h4>
                  <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-tight">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
