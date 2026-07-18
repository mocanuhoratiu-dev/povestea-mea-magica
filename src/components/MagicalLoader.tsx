"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanternSignature from "@/components/LanternSignature";

const loadingMessages = [
  "Lanterna adună detaliile poveștii...",
  "Așezăm cu grijă lumea copilului...",
  "Scriem aventura pe pagini...",
  "Pregătim ultima scânteie..."
];

export default function MagicalLoader({ isVisible }: { isVisible: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-brand-navy flex flex-col items-center justify-center text-brand-cream"
        >
          <LanternSignature className="mb-10" size="lg" tone="paper" label="Lanterna creează materialul" />
          
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={msgIdx}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl md:text-3xl font-black font-nunito tracking-tight text-center px-6 text-brand-cream"
              >
                {loadingMessages[msgIdx]}
              </motion.h2>
            </AnimatePresence>
          </div>
          
          <div className="mt-12 h-1.5 w-52 overflow-hidden bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="h-full bg-brand-gold"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
