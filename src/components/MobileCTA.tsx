"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { siteCopy } from "@/lib/siteMode";

export default function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-6 left-6 right-6 z-[9990] md:hidden"
        >
          <a
            href="#creator"
            className="block w-full bg-brand-purple text-brand-cream py-4 rounded-2xl font-black text-center shadow-[0_10px_30px_rgba(155,89,182,0.4)] border-b-4 border-brand-purple-light"
          >
            {siteCopy.mobileCta}
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
