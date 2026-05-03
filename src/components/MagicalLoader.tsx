"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const loadingMessages = [
  "🪄 Chemăm personajele din tărâmul fermecat...",
  "🌌 Pictăm cerul de poveste...",
  "📜 Scriem fiecare cuvânt cu grijă...",
  "✨ Presărăm magia finală..."
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
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="mb-8"
          >
            <Sparkles size={80} className="text-brand-gold" />
          </motion.div>
          
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
          
          <div className="mt-12 w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="h-full bg-brand-purple"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
