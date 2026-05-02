"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Cât durează până primesc povestea?",
    answer: "Procesarea este instantanee. Imediat ce plata este confirmată, sistemul nostru generează povestea și o trimite pe adresa de email introdusă.",
  },
  {
    question: "În ce format primesc fișierele?",
    answer: "Vei primi un fișier PDF de înaltă calitate, optimizat pentru tablete, telefoane sau imprimare, și un fișier MP3 pentru varianta audio (dacă este selectată).",
  },
  {
    question: "Pot schimba datele după ce am plătit?",
    answer: "Deoarece generarea este automată și instantanee, te rugăm să verifici cu atenție datele înainte de plată. Dacă totuși apare o greșeală majoră, contactează-ne pe email.",
  },
  {
    question: "Este sigură plata cu cardul?",
    answer: "Da, folosim Stripe, cel mai sigur procesator de plăți la nivel mondial. Nu stocăm datele cardului tău pe serverele noastre.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-nunito font-extrabold text-4xl text-brand-navy">
            Întrebări Frecvente
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-brand-navy/10 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-brand-cream/50 transition-colors"
              >
                <span className="font-bold text-brand-navy text-lg">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-brand-purple transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-brand-navy/70 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
