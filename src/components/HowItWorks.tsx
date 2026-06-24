"use client";

import { motion } from "framer-motion";
import { UserCircle, Wand, Rocket } from "lucide-react";

const steps = [
  {
    icon: <UserCircle className="w-10 h-10 text-white" />,
    title: "Cine e Eroul?",
    description: "Spune-ne numele micuțului și alege-i vârsta ca să știm ce aventură i se potrivește!",
    color: "bg-brand-pink",
    shadow: "shadow-brand-pink/30",
  },
  {
    icon: <Wand className="w-10 h-10 text-white" />,
    title: "Alege Magia",
    description: "Vrei o aventură în spațiu, într-un castel sau în pădure? Tu alegi tema și morala!",
    color: "bg-brand-purple",
    shadow: "shadow-brand-purple/30",
  },
  {
    icon: <Rocket className="w-10 h-10 text-white" />,
    title: "Descarcă și testează",
    description: "Generezi o previzualizare, o asculți în browser și descarci PDF-ul ca să vezi exact cum arată produsul.",
    color: "bg-brand-blue",
    shadow: "shadow-brand-blue/30",
  },
];

export default function HowItWorks() {
  return (
    <section id="cum-functioneaza" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-brand-gold/10 rounded-full -translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-pink/5 rounded-full translate-x-24 translate-y-24" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm mb-4"
          >
            Previzualizare interactivă
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-nunito font-extrabold text-4xl md:text-5xl text-brand-navy"
          >
            Cum prinde formă <span className="text-brand-pink">magia</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -15 }}
              className={`bg-brand-cream p-12 rounded-[3rem] border-4 border-white shadow-xl ${step.shadow} transition-all group relative`}
            >
              <div className={`${step.color} w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 rotate-3 group-hover:rotate-12 transition-transform shadow-lg`}>
                {step.icon}
              </div>
              <h3 className="font-nunito font-extrabold text-2xl text-brand-navy mb-4">
                {step.title}
              </h3>
              <p className="text-brand-navy/70 leading-relaxed font-medium">
                {step.description}
              </p>
              
              {/* Step number badge */}
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-brand-navy text-brand-cream flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                {index + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
