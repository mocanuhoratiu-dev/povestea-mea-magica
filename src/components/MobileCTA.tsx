"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
          className="fixed bottom-4 left-4 right-4 z-[9990] md:hidden"
        >
          <Link
            href="/#alege-materialul"
            className="block w-full bg-brand-navy py-4 text-center font-black text-brand-cream shadow-[0_10px_30px_rgba(36,50,79,0.28)]"
          >
            {siteCopy.mobileCta}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
