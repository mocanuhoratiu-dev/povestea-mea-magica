"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { clampLumiProgress, lumiGenerationCopy, type LumiGenerationPhase } from "@/lib/lumiExperience";

const LumiVisual3D = dynamic(() => import("@/components/LumiVisual3D"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full w-full animate-pulse bg-[url('/lumi-guardian.webp')] bg-contain bg-center bg-no-repeat" />,
});

export default function LumiGenerationStage({ phase, progress }: { phase: LumiGenerationPhase; progress: number }) {
  const copy = lumiGenerationCopy[phase];
  const safeProgress = clampLumiProgress(progress);
  const complete = phase === "ready";

  return (
    <section className="relative isolate overflow-hidden border border-brand-gold/55 bg-brand-navy px-4 py-5 text-brand-cream sm:px-6" aria-live="polite" aria-label={`${copy.title}, ${safeProgress}%`}>
      <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,rgba(229,184,79,.2)_0_1px,transparent_2px),radial-gradient(circle_at_78%_32%,rgba(255,255,255,.18)_0_1px,transparent_2px)] [background-size:82px_82px,106px_106px]" />
      <div className="relative grid grid-cols-[76px_1fr] items-center gap-4 sm:grid-cols-[104px_1fr] sm:gap-6">
        <div className="relative h-24 sm:h-32">
          <LumiVisual3D className="h-full w-full" state={copy.visualState} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-brand-gold">
            {complete ? <Check size={14} /> : <LoaderCircle size={14} className="animate-spin" />}
            Lumi {complete ? "a terminat" : "lucrează"}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={phase} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}>
              <h3 className="mt-2 font-serif text-xl leading-tight text-white sm:text-2xl">{copy.title}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-cream/72 sm:text-sm">{copy.message}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="relative mt-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-brand-cream/55"><span>Progresul mostrei</span><span className="tabular-nums text-brand-gold">{safeProgress}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden bg-white/10">
          <motion.div className="relative h-full bg-brand-gold" initial={false} animate={{ width: `${Math.max(4, safeProgress)}%` }} transition={{ duration: 0.7, ease: "easeOut" }}>
            {!complete && <Sparkles size={13} className="absolute -right-1.5 -top-1.5 text-white" />}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
