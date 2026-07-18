"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Cum creez un material personalizat?",
    answer: "Alegi produsul, completezi câteva detalii despre copil și apeși pe Generare. Verifici rezultatul, îl poți ajusta din alegerile tale, apoi descarci PDF-ul pregătit pentru citit sau print.",
  },
  {
    question: "Ce primesc pentru fiecare produs?",
    answer: "Povestea include copertă ilustrată, dedicație și pagini de poveste. Scutul Magic are certificat, ritual și etichete, iar Trusa Magică de Urgență include activități de printat pentru momentele de așteptare.",
  },
  {
    question: "Cât durează generarea?",
    answer: "De obicei, materialul este gata în mai puțin de un minut. O poveste completă și coperta ei pot avea nevoie de puțin mai mult timp, pentru ca rezultatul să fie creat special din alegerile tale.",
  },
  {
    question: "Povestea chiar ține cont de alegerile mele?",
    answer: "Da. Numele, vârsta, lumea aleasă, lecția, tonul și detaliile adăugate de tine ghidează aventura, personajul principal și coperta. Fiecare generație pornește de la aceste alegeri.",
  },
  {
    question: "Pot schimba ceva înainte să descarc PDF-ul?",
    answer: "Da. Poți modifica opțiunile din formular și genera o variantă nouă. Pentru poveste, poți cere și o copertă nouă fără să schimbi textul.",
  },
  {
    question: "Pot printa materialele?",
    answer: "Da. PDF-urile sunt gândite pentru format A4 și se pot citi pe telefon, tabletă sau calculator, dar arată cel mai bine atunci când sunt printate acasă ori la un centru de print.",
  },
  {
    question: "Care sunt prețurile?",
    answer: "La lansarea comercială, povestea va costa 29 lei, iar Scutul Magic și Trusa Magică de Urgență câte 19 lei. Pachetul cu toate cele trei materiale va fi 49 lei. Acum ai acces de lansare gratuit și poți continua direct către generare.",
  },
  {
    question: "Ce fac dacă generarea nu se finalizează?",
    answer: "Mai încearcă o dată după câteva momente. Dacă problema persistă, păstrează alegerile din formular și scrie-ne la contact@povesteamagica.ro cu o scurtă descriere a situației.",
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
