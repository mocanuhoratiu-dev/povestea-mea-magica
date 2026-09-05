"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Check, ScanFace, Sparkles } from "lucide-react";

const childDetails = ["numele Eva", "păr șaten, ondulat", "salopetă cărămizie", "iubește stelele"];

export default function PersonalizationProof() {
  return (
    <section className="overflow-hidden bg-white px-5 py-16 sm:px-6 md:py-24" aria-labelledby="personalization-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-brand-navy/15 pb-10 lg:grid-cols-[.86fr_1.14fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">De la detalii la personaj</p>
            <h2 id="personalization-title" className="mt-4 font-nunito text-4xl font-black leading-tight text-brand-navy sm:text-5xl">
              Nu schimbăm doar numele de pe copertă.
            </h2>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-relaxed text-brand-navy/68 sm:text-lg">
            Aspectul, oamenii dragi și lucrurile preferate ale copilului devin repere vizuale și narative care continuă din prima pagină până la final.
          </p>
        </div>

        <div className="mt-10 grid border border-brand-navy/15 lg:grid-cols-[.78fr_auto_1.22fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            className="flex min-h-[420px] flex-col justify-between bg-brand-cream p-7 sm:p-10"
          >
            <div>
              <div className="flex items-center justify-between border-b border-brand-navy/15 pb-5">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Înainte · descrierea</span>
                <ScanFace size={26} className="text-brand-purple" strokeWidth={1.7} />
              </div>
              <p className="mt-8 font-serif text-3xl leading-tight text-brand-navy sm:text-4xl">„Eva pornește în căutarea unei steluțe care și-a pierdut lumina.”</p>
              <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-brand-navy/12 py-6">
                {childDetails.map((detail) => (
                  <span key={detail} className="flex items-start gap-2 text-sm font-bold leading-snug text-brand-navy/72">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-green" /> {detail}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-8 text-sm font-semibold leading-relaxed text-brand-navy/58">Fotografia este opțională. O descriere atentă este suficientă pentru a construi personajul.</p>
          </motion.div>

          <div className="relative z-10 hidden w-0 items-center justify-center lg:flex">
            <div className="grid h-14 w-14 -translate-x-1/2 place-items-center border border-brand-gold bg-brand-navy text-brand-gold shadow-xl" aria-hidden="true">
              <ArrowRight size={23} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="relative min-h-[430px] overflow-hidden bg-brand-navy sm:min-h-[560px]"
          >
            <Image
              src="/examples/album/coperta.webp"
              alt="Coperta personalizată a poveștii Evei, cu personajul ilustrat"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-[78%_50%] sm:object-center"
            />
            <div className="absolute inset-x-0 bottom-0 bg-brand-navy/92 px-6 py-5 text-brand-cream backdrop-blur-sm sm:px-8">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-gold"><Sparkles size={15} /> După · personajul în carte</p>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-brand-cream/78">Aceleași trăsături, haine și repere sunt urmărite în copertă și în fiecare scenă a poveștii.</p>
            </div>
          </motion.div>
        </div>
        <p className="mt-4 text-right text-xs font-bold text-brand-navy/75">Poveste-model · Povestea Magică a Evei</p>
      </div>
    </section>
  );
}
