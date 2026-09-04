"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Cum aleg materialul potrivit?",
    answer: "Povestea Magică este cartea ilustrată în care copilul devine eroul aventurii. Scutul de Noapte construiește un ritual blând în jurul unei temeri, iar Trusa de Răbdare aduce activități pentru drum, restaurant, medic sau alte așteptări.",
  },
  {
    question: "Ce primesc?",
    answer: "Povestea Magică include o carte ilustrată de 16 pagini și un caiet separat de 5 pagini, cu colorat, labirint și joc de diferențe. Scutul de Noapte are 6 pagini, iar Trusa de Răbdare are 7 pagini, toate personalizate și pregătite pentru print.",
  },
  {
    question: "Este personalizat cu adevărat?",
    answer: "Da. Numele, vârsta, aspectul, lumea, personajele apropiate și ideea familiei schimbă atât firul poveștii, cât și imaginile. Poți porni de la o descriere sau de la o fotografie și poți adăuga o dedicație personală.",
  },
  {
    question: "Cât durează?",
    answer: "Scutul și Trusa sunt gata, de regulă, în mai puțin de un minut. Povestea Magică poate dura 6-10 minute, deoarece personajul, coperta, cele 13 scene și activitățile sunt create și verificate separat.",
  },
  {
    question: "Pot modifica ceva înainte de PDF?",
    answer: "Da. Pentru Povestea Magică răsfoiești înainte de plată coperta și două pagini interioare personalizate, cu watermark discret. Dacă schimbi alegerile, poți crea un preview nou. Coperta confirmată devine reperul vizual al personajului în întreaga carte.",
  },
  {
    question: "Pot printa materialele?",
    answer: "Da. Povestea Magică și caietul de activități folosesc format A5 landscape. Scutul și Trusa sunt pregătite pentru A4. Toate pot fi tipărite acasă sau la un centru de print.",
  },
  {
    question: "Care sunt prețurile?",
    answer: "Povestea Magică costă 59 lei. Scutul de Noapte și Trusa de Răbdare costă câte 19 lei. Pachetul Complet le include pe toate la 79 lei, în loc de 97 lei. Prețul final este afișat înainte de plata securizată.",
  },
  {
    question: "Sunt materialele un sfat medical sau terapeutic?",
    answer: "Nu. Sunt povești, activități și ritualuri de joacă. Dacă o teamă sau o situație este intensă ori persistă, cel mai potrivit este să discuți cu un specialist.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="border-b border-brand-navy/15 pb-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Înainte să începi</p>
          <h2 className="mt-4 font-nunito text-4xl font-black text-brand-navy">Întrebări frecvente</h2>
        </div>
        <div className="divide-y divide-brand-navy/12">
          {faqs.map((faq, index) => (
            <div key={faq.question}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-xl leading-tight text-brand-navy md:text-2xl">{faq.question}</span>
                <ChevronDown className={`shrink-0 text-brand-purple transition-transform ${openIndex === index ? "rotate-180" : ""}`} size={20} />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="max-w-2xl pb-6 text-base font-medium leading-relaxed text-brand-navy/70">{faq.answer}</p>
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
