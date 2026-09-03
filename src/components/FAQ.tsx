"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Cum aleg materialul potrivit?",
    answer: "Începe cu momentul pe care îl aveți acum: Povestea de Seară pentru conectare, Scutul de Noapte pentru un ritual de curaj și Trusa de Răbdare pentru așteptări. Pentru o experiență vizuală mai bogată, alege Albumul Meu Magic.",
  },
  {
    question: "Ce primesc?",
    answer: "Primești unul sau două PDF-uri personalizate, pregătite pentru citit ori print. Albumul include o carte ilustrată de 16 pagini și un caiet separat de 5 pagini, cu colorat, labirint și joc de diferențe. Povestea de Seară are 2 sau 4 pagini de aventură, iar kiturile includ ritualurile și activitățile descrise înainte de comandă.",
  },
  {
    question: "Este personalizat cu adevărat?",
    answer: "Da. Numele, vârsta, lumea, lecția și detaliile pe care le alegi schimbă felul în care arată povestea sau misiunile. Pentru poveste poți adăuga și o dedicație de la familie.",
  },
  {
    question: "Cât durează?",
    answer: "Materialele scurte sunt gata, de obicei, în mai puțin de un minut. Albumul ilustrat poate dura 6-10 minute, deoarece personajul, coperta, cele 13 scene și imaginile pentru activități sunt create separat la rezoluție mare.",
  },
  {
    question: "Pot modifica ceva înainte de PDF?",
    answer: "Da. Pentru Albumul Meu Magic vezi coperta personalizată înainte de plată, cu un watermark discret. Dacă schimbi alegerile, creezi un preview nou, iar coperta confirmată devine reperul vizual al personajului în album. Pentru Povestea de Seară poți edita textul înainte de descărcare și poți regenera coperta.",
  },
  {
    question: "Pot printa materialele?",
    answer: "Da. Poveștile și kiturile sunt gândite pentru A4. Albumul și caietul lui de activități folosesc format A5 landscape și pot fi tipărite acasă sau la un centru de print.",
  },
  {
    question: "Care sunt prețurile?",
    answer: "Povestea scurtă costă 19 lei, cea lungă 29 lei, iar fiecare kit costă 19 lei. Pachetul Familiei Magice costă 49 lei, iar Albumul Meu Magic costă 59 lei. Pachetul Complet costă 99 lei și le reunește pe toate în cinci PDF-uri.",
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
