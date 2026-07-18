"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, ArrowRight, Eye } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { siteCopy } from "@/lib/siteMode";

export default function Hero() {
  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-brand-navy px-6 pb-12 pt-28 text-brand-cream lg:min-h-[640px]">
      <Image
        src="/hero-storybook.png"
        alt="Un copil cu o lanternă alături de un dragon blând, într-o pădure de noapte"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[64%_50%] opacity-65"
      />
      <div className="absolute inset-0 bg-brand-navy/65" />
      <div className="relative mx-auto flex min-h-[470px] max-w-7xl flex-col justify-center lg:min-h-[490px]">
        <motion.div
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="mb-7 flex items-center gap-3">
            <BrandMark className="h-12 w-12" tone="paper" title="Lanterna Magică" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Povestea Mea Magică</p>
              <p className="mt-1 text-sm font-semibold text-brand-cream/75">{siteCopy.heroBadge}</p>
            </div>
          </div>
          <h1 className="max-w-2xl font-nunito text-5xl font-black leading-[1.03] tracking-normal text-brand-cream md:text-7xl">
            Momente mici.<br /><span className="text-brand-gold">Magie pe bune.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-brand-cream/90 md:text-xl">
            Povești de seară, ritualuri pentru nopțile cu emoții și misiuni pentru timpul de așteptare. Făcute pentru momentul vostru.
          </p>
          <p className="mt-5 max-w-xl border-l-2 border-brand-gold bg-brand-navy/30 px-4 py-3 text-sm font-bold leading-relaxed text-brand-cream/85">{siteCopy.launchAccess}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <motion.a
              href="#alege-materialul"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-3 bg-brand-gold px-7 py-4 text-base font-black text-brand-navy shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-colors hover:bg-brand-cream"
            >
              {siteCopy.heroCta} <ArrowRight size={19} />
            </motion.a>
            <a
              href="/modele"
              className="inline-flex items-center justify-center gap-3 border border-brand-cream/50 px-7 py-4 text-base font-black text-brand-cream transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <Eye size={19} /> Vezi modelele
            </a>
          </div>
        </motion.div>
        <a href="#alege-materialul" className="absolute bottom-0 hidden items-center gap-2 text-sm font-bold text-brand-cream/75 transition-colors hover:text-brand-gold md:inline-flex">
          Descoperă materialele <ArrowDown size={16} />
        </a>
      </div>
    </section>
  );
}
