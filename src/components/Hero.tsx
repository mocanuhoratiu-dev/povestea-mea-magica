"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowDown, ArrowRight, Eye } from "lucide-react";
import InstantStoryPreview from "@/components/InstantStoryPreview";
import LanternSignature from "@/components/LanternSignature";
import { siteCopy } from "@/lib/siteMode";

export default function Hero() {
  return (
    <section id="home-hero" className="relative isolate min-h-[600px] overflow-hidden bg-brand-navy px-5 pb-10 pt-24 text-brand-cream sm:px-6 lg:min-h-[640px] lg:pb-12 lg:pt-28">
      <Image
        src="/hero-storybook.png"
        alt="Un copil cu o lanternă alături de un dragon blând, într-o pădure de noapte"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[58%_50%] opacity-65 sm:object-[64%_50%]"
      />
      <div className="absolute inset-0 bg-brand-navy/65" />
      <div className="relative mx-auto grid min-h-[500px] max-w-7xl items-center gap-8 py-5 lg:min-h-[540px] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.74fr)] lg:gap-16 lg:py-8">
        <motion.div
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl text-center lg:text-left"
        >
          <div className="mb-6 flex items-center justify-center gap-3 lg:mb-7 lg:justify-start">
            <LanternSignature size="sm" className="shrink-0" tone="paper" label="Lanterna Magică" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Povestea Mea Magică</p>
              <p className="mt-1 text-sm font-semibold text-brand-cream/75">{siteCopy.heroBadge}</p>
            </div>
          </div>
          <h1 className="mx-auto max-w-2xl font-nunito text-[2.75rem] font-black leading-[1.03] tracking-normal text-brand-cream sm:text-5xl md:text-7xl lg:mx-0">
            Momente mici.<br /><span className="text-brand-gold">Magie pe bune.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-brand-cream/90 sm:mt-6 sm:text-lg md:text-xl lg:mx-0">
            Povești de seară, ritualuri pentru nopțile cu emoții și misiuni pentru timpul de așteptare. Făcute pentru momentul vostru.
          </p>
          <p className="mx-auto mt-5 max-w-xl border-y border-brand-gold/70 bg-brand-navy/30 px-4 py-3 text-sm font-bold leading-relaxed text-brand-cream/85 lg:mx-0 lg:border-y-0 lg:border-l-2">{siteCopy.launchAccess}</p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row lg:justify-start">
            <motion.a
              href="#alege-materialul"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex w-full items-center justify-center gap-3 bg-brand-gold px-7 py-4 text-base font-black text-brand-navy shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-colors hover:bg-brand-cream sm:w-auto"
            >
              {siteCopy.heroCta} <ArrowRight size={19} />
            </motion.a>
            <a
              href="/modele"
              className="inline-flex w-full items-center justify-center gap-3 border border-brand-cream/50 px-7 py-4 text-base font-black text-brand-cream transition-colors hover:border-brand-gold hover:text-brand-gold sm:w-auto"
            >
              <Eye size={19} /> Vezi modelele
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }} className="mx-auto w-full max-w-[320px] justify-self-center sm:max-w-md lg:mr-0 lg:max-w-md lg:justify-self-end">
          <InstantStoryPreview />
        </motion.div>
        <a href="#alege-materialul" className="absolute bottom-0 hidden items-center gap-2 text-sm font-bold text-brand-cream/75 transition-colors hover:text-brand-gold md:inline-flex">
          Descoperă materialele <ArrowDown size={16} />
        </a>
      </div>
    </section>
  );
}
