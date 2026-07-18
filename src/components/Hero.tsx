"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import { siteCopy } from "@/lib/siteMode";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-brand-cream">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink font-bold text-sm tracking-wide uppercase">
            <Sparkles size={16} /> Personalizat pentru copilul tău
          </div>
          <h1 className="font-nunito font-extrabold text-5xl md:text-7xl text-brand-navy leading-tight">
            Copilul tău, <span className="text-brand-purple italic">eroul</span> poveștii.
          </h1>
          <p className="mt-6 text-xl text-brand-navy/80 leading-relaxed max-w-xl font-medium">
            O poveste de seară, un scut pentru nopți cu emoții sau o trusă pentru momentele lungi de așteptare. Alegi ce vă ajută chiar acum.
          </p>

          <p className="mt-5 max-w-xl text-sm font-bold leading-relaxed text-brand-navy/60">
            {siteCopy.launchAccess}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <motion.a
              href="#alege-materialul"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-3 bg-brand-purple text-brand-cream px-8 py-4 rounded-lg font-extrabold text-lg shadow-xl hover:shadow-brand-purple/30 transition-all text-center"
            >
              {siteCopy.heroCta} <ArrowRight size={20} />
            </motion.a>
            <a
              href="/modele"
              className="inline-flex items-center justify-center gap-3 border-2 border-brand-navy/15 px-8 py-4 rounded-lg font-extrabold text-lg text-brand-navy hover:border-brand-purple hover:text-brand-purple transition-colors"
            >
              <Eye size={20} /> Vezi modelele
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "backOut", delay: 0.2 }}
          className="relative group will-change-transform"
        >
          <div className="relative z-10 w-full animate-float will-change-transform">
            <Image
              src="/hero-storybook.png"
              alt="Ilustrație Magică"
              width={800}
              height={600}
              className="object-contain drop-shadow-[0_35px_35px_rgba(155,89,182,0.3)] transition-transform group-hover:scale-105 duration-700"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
