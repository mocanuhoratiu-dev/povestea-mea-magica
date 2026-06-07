"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Andreea M.",
    role: "Mamă a unui băiețel de 4 ani 👩‍👦",
    text: "Este singura poveste pe care băiețelul meu o mai vrea înainte de culcare. A fost fascinat să audă că el este personajul principal!",
  },
  {
    name: "Mihai T.",
    role: "Tată de fetiță 👨‍👧",
    text: "Calitatea ilustrațiilor din PDF este impresionantă. Iar varianta audio ne salvează în serile în care suntem prea obosiți să citim.",
  },
  {
    name: "Raluca S.",
    role: "Mamă a doi copii 👩‍👧‍👦",
    text: "Am cumpărat povestea cu 'împărțitul jucăriilor' și chiar a ajutat! Copiii au fost mult mai receptivi văzându-se pe ei în poveste.",
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
            Păreri sincere ❤️
          </motion.div>
          <h2 className="font-nunito font-extrabold text-4xl md:text-5xl text-brand-navy">
            Părinți Fericiți, Copii <span className="text-brand-purple">Fascinați</span>
          </h2>
          <p className="mt-4 text-brand-navy/60 text-lg max-w-2xl mx-auto font-medium">
            Mii de familii au descoperit deja magia poveștilor noastre personalizate.
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
