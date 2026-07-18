"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Cum aleg materialul potrivit?",
    answer: "Începe cu momentul pe care îl aveți acum: Povestea de Seară pentru conectare înainte de somn, Scutul de Noapte pentru un ritual de curaj și Trusa de Răbdare pentru drumuri sau așteptări.",
  },
  {
    question: "Ce primesc?",
    answer: "Primești un PDF personalizat, pregătit pentru citit sau print. Povestea include copertă, dedicație și patru pagini de aventură. Scutul are certificat, ritual și etichete. Trusa are activități adaptate locului ales și diplomă de final.",
  },
  {
    question: "Este personalizat cu adevărat?",
    answer: "Da. Numele, vârsta, lumea, lecția și detaliile pe care le alegi schimbă felul în care arată povestea sau misiunile. Pentru poveste poți adăuga și o dedicație de la familie.",
  },
  {
    question: "Cât durează?",
    answer: "De obicei, materialul este gata în mai puțin de un minut. Povestea și coperta pot dura puțin mai mult, deoarece sunt create pornind de la alegerile tale.",
  },
  {
    question: "Pot modifica ceva înainte de PDF?",
    answer: "Da. Poți ajusta alegerile și crea o variantă nouă. În cazul poveștii, poți edita textul înainte de descărcare și poți regenera coperta.",
  },
  {
    question: "Pot printa materialele?",
    answer: "Da. Sunt gândite pentru A4 și funcționează bine atât pe ecran, cât și printate acasă sau la un centru de print.",
  },
  {
    question: "Care sunt prețurile?",
    answer: "Povestea de Seară este 29 lei, iar Scutul de Noapte și Trusa de Răbdare sunt câte 19 lei. Pachetul cu toate trei este 49 lei. Vei vedea clar pasul de plată înainte ca aceste prețuri să devină aplicabile.",
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
