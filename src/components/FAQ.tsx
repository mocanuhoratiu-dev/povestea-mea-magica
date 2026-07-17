"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { isProductionMode } from "@/lib/siteMode";

const faqs = [
  {
    question: "Cât durează până primesc povestea?",
    answer: isProductionMode
      ? "Povestea se generează direct în browser în aproximativ câteva secunde, în funcție de disponibilitatea serviciilor AI."
      : "În demo, povestea se generează direct în browser în aproximativ câteva secunde, în funcție de disponibilitatea serviciilor AI.",
  },
  {
    question: "În ce format primesc fișierele?",
    answer: isProductionMode
      ? "Poți descărca un PDF generat local în browser. Testul audio este disponibil separat pentru verificarea vocii."
      : "Poți descărca un PDF generat local în browser. Previzualizarea audio este disponibilă separat pentru testarea vocii.",
  },
  {
    question: "Pot schimba datele după generare?",
    answer: isProductionMode
      ? "Da. Modifici numele, vârsta, tema sau contextul și generezi din nou înainte să descarci PDF-ul final."
      : "Da. Modifici numele, vârsta, tema sau contextul și generezi din nou. Pentru lansarea comercială vom adăuga și un flux clar de comandă.",
  },
  {
    question: "Pot folosi textele pentru copii mici?",
    answer: "Da, prompturile sunt gândite pentru un ton blând, potrivit pentru copii. Totuși, recomandăm ca un adult să citească rezultatul înainte de folosire.",
  },
  {
    question: "Ce se întâmplă dacă AI-ul este indisponibil?",
    answer: "Avem un fallback stabil pentru poveste, astfel încât experiența să nu se blocheze. Pentru producție comercială, recomandăm folosirea unei chei AI cu quota stabilă.",
  },
  {
    question: "Sunt kiturile anti-frică un sfat medical?",
    answer: "Nu. Sunt materiale creative și ritualuri de joacă pentru seară. Dacă fricile sunt intense sau persistente, e mai potrivit să discuți cu un specialist.",
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
