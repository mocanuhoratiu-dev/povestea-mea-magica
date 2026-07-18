"use client";

import { motion } from "framer-motion";
import { ListChecks, Wand, Download } from "lucide-react";
import { siteCopy } from "@/lib/siteMode";

const steps = [
  {
    icon: <ListChecks className="w-9 h-9 text-white" />,
    title: "Alege momentul",
    description: "Alegi o poveste pentru seară, un ritual pentru nopțile cu emoții sau o activitate pentru timpul de așteptare.",
    color: "bg-brand-pink",
    shadow: "shadow-brand-pink/30",
  },
  {
    icon: <Wand className="w-10 h-10 text-white" />,
    title: "Adaugă detaliile",
    description: "Numele, vârsta și câteva preferințe transformă materialul într-unul făcut pentru copilul tău.",
    color: "bg-brand-purple",
    shadow: "shadow-brand-purple/30",
  },
  {
    icon: <Download className="w-9 h-9 text-white" />,
    title: "Generează și descarcă",
    description: "Verifici rezultatul și descarci PDF-ul pregătit pentru citit, print sau folosit imediat.",
    color: "bg-brand-blue",
    shadow: "shadow-brand-blue/30",
  },
];

export default function HowItWorks() {
  return (
    <section id="cum-functioneaza" className="py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm mb-4"
          >
            {siteCopy.heroBadge}
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
              className={`bg-white p-8 md:p-10 rounded-lg border border-brand-navy/10 shadow-lg ${step.shadow} transition-all group relative`}
            >
              <div className={`${step.color} w-16 h-16 rounded-lg flex items-center justify-center mb-7 transition-transform shadow-lg`}>
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
