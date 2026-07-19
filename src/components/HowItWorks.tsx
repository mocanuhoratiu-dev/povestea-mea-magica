"use client";

import { motion } from "framer-motion";
import { Download, ListChecks, Wand2 } from "lucide-react";

const steps = [
  { icon: ListChecks, title: "Alege momentul", description: "Începi cu seara, noaptea sau timpul de așteptare. Alegerea ta fixează rolul materialului.", number: "01" },
  { icon: Wand2, title: "Spune-ne ce contează", description: "Numele, vârsta și câteva preferințe transformă materialul într-unul făcut pentru copilul tău.", number: "02" },
  { icon: Download, title: "Folosiți-l împreună", description: "Verifici rezultatul și îl descarci ca PDF pentru citit, print sau un mic ritual de familie.", number: "03" },
];

export default function HowItWorks() {
  return (
    <section id="cum-functioneaza" className="bg-white px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center md:mx-0 md:text-left">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Simplu de făcut</p>
          <h2 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-5xl">Trei pași spre un moment mai bun</h2>
        </div>
        <div className="mt-9 grid grid-cols-1 border-y border-brand-navy/15 md:mt-14 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="min-h-[220px] border-b border-brand-navy/15 px-0 py-7 text-center last:border-b-0 md:min-h-[260px] md:border-b-0 md:border-r md:px-8 md:py-10 md:text-left md:first:pl-0 md:last:border-r-0"
              >
                <div className="flex items-center justify-center gap-4 md:justify-between"><Icon className="text-brand-purple" size={28} /><span className="font-mono text-sm font-black text-brand-gold">{step.number}</span></div>
                <h3 className="mt-6 font-serif text-3xl text-brand-navy md:mt-10">{step.title}</h3>
                <p className="mx-auto mt-4 max-w-sm text-base font-medium leading-relaxed text-brand-navy/65 md:mx-0">{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
