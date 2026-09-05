"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { faqs } from "@/lib/faq";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="intrebari-frecvente" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="border-b border-brand-navy/15 pb-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Înainte să începi</p>
          <h2 className="mt-4 font-nunito text-4xl font-black text-brand-navy">Întrebări frecvente</h2>
        </div>
        <div className="divide-y divide-brand-navy/12">
          {faqs.map((faq, index) => (
            <div key={faq.question}>
              <button
                id={`faq-question-${index}`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-xl leading-tight text-brand-navy md:text-2xl">{faq.question}</span>
                <ChevronDown className={`shrink-0 text-brand-purple transition-transform ${openIndex === index ? "rotate-180" : ""}`} size={20} />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
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
