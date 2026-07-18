"use client";

import { motion } from "framer-motion";
import { FileCheck2, HeartHandshake, Sparkles } from "lucide-react";

const benefits = [
  {
    title: "Copilul rămâne în centru",
    text: "Numele și alegerile familiei schimbă aventura, ritualul sau misiunea. Nu adăugăm doar un nume într-un șablon.",
    icon: Sparkles,
  },
  {
    title: "Un format ușor de păstrat",
    text: "Fiecare material este gândit pentru A4, pentru citit pe ecran și pentru serile în care vrei să îl scoți din nou din sertar.",
    icon: FileCheck2,
  },
  {
    title: "Pentru situații adevărate",
    text: "Somnul, emoțiile de noapte și așteptarea sunt tratate cu un ton blând, fără promisiuni mari și fără presiune.",
    icon: HeartHandshake,
  },
];

export default function Reviews() {
  return (
    <section id="recenzii" className="bg-brand-cream px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-brand-navy/15 pb-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Ce susținem</p>
            <h2 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-5xl">Mai puțină improvizație. Mai multă apropiere.</h2>
          </div>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Nu avem nevoie de artificii ca să facem un moment memorabil. Avem nevoie de cuvinte potrivite, o structură bună și suficient loc pentru imaginația copilului.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.article
                key={benefit.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border border-brand-navy/12 bg-white p-8"
              >
                <Icon className="text-brand-purple" size={28} strokeWidth={1.8} />
                <h3 className="mt-8 font-serif text-3xl leading-tight text-brand-navy">{benefit.title}</h3>
                <p className="mt-4 text-base font-medium leading-relaxed text-brand-navy/70">{benefit.text}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
