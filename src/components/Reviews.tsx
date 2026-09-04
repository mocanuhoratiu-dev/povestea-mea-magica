"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Ador cât de simplu este să creezi o poveste pentru copii.",
    name: "Florentina",
    detail: "mamă a unui băiat și a unei fete",
  },
  {
    quote: "Am găsit ceva distractiv care o ajută pe fetița mea să se liniștească atunci când îi este teamă de întuneric. Mi se pare o idee genială.",
    name: "Antonia",
    detail: "mamă a unei fetițe",
  },
  {
    quote: "Am testat zona de activități în timp ce eram la restaurant cu fata cea mare. Am fost uimită de cât de captivată a fost.",
    name: "Larisa",
    detail: "mamă a două fete",
  },
];

export default function Reviews() {
  return (
    <section id="recenzii" className="bg-brand-cream px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-brand-navy/15 pb-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Spus de părinți</p>
            <h2 className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy md:text-5xl">Primele povești, primele seri și primele reacții.</h2>
          </div>
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-brand-navy/70">Recenzii primite de la familiile care au testat poveștile, ritualurile și activitățile Povestea Mea Magică.</p>
        </div>
        <motion.figure
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          className="mt-12 grid overflow-hidden border border-brand-gold/45 bg-brand-navy md:grid-cols-[.68fr_1.32fr]"
        >
          <div className="flex min-h-44 flex-col justify-between bg-brand-purple px-7 py-8 text-white md:px-10">
            <Quote size={32} strokeWidth={1.6} className="text-brand-gold" aria-hidden="true" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Din primele familii</p>
              <p className="mt-2 font-serif text-3xl leading-tight">O poveste care începe ușor.</p>
            </div>
          </div>
          <div className="flex flex-col justify-between px-7 py-8 md:px-10">
            <blockquote className="font-serif text-2xl leading-relaxed text-brand-cream md:text-3xl">„Îmi place foarte mult ideea voastră și am rămas plăcut impresionat de cât de ușor este să avem o poveste împreună cu copiii mei.”</blockquote>
            <figcaption className="mt-7 border-t border-brand-cream/20 pt-4 text-sm font-black text-brand-gold">Bogdan <span className="font-semibold text-brand-cream/70">· tată a doi copii</span></figcaption>
          </div>
        </motion.figure>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.figure
              key={testimonial.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08 }}
              className="flex min-h-64 flex-col justify-between border border-brand-navy/12 bg-white p-7"
            >
              <Quote size={24} strokeWidth={1.6} className="text-brand-purple" aria-hidden="true" />
              <blockquote className="mt-7 font-serif text-xl leading-relaxed text-brand-navy">„{testimonial.quote}”</blockquote>
              <figcaption className="mt-7 border-t border-brand-navy/10 pt-4 text-sm font-black text-brand-purple">
                {testimonial.name} <span className="font-semibold text-brand-navy/60">· {testimonial.detail}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
