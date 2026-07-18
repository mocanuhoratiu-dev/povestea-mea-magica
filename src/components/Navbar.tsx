"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { siteCopy } from "@/lib/siteMode";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-1/2 z-[10000] w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2"
    >
      <div className="flex items-center justify-between border border-brand-navy/10 bg-brand-cream/95 px-4 py-3 shadow-[0_12px_35px_rgba(36,50,79,0.14)] backdrop-blur-xl md:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" title="Povestea Mea Magică" />
          <span className="font-serif text-base leading-none text-brand-navy md:text-lg">
            Povestea Mea <span className="text-brand-purple italic">Magică</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {[
            { label: "Povestea de seară", href: "/#creator" },
            { label: "Scutul de noapte", href: "/#monster-away" },
            { label: "Trusa de răbdare", href: "/#emergency-kit" },
            { label: "Modele", href: "/modele" },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="relative text-sm font-bold text-brand-navy/70 transition-colors hover:text-brand-purple"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 h-px w-0 bg-brand-gold transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        <Link
          href="/#alege-materialul"
          className="bg-brand-navy px-4 py-2.5 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple active:scale-95 md:px-5"
        >
          {siteCopy.navCta}
        </Link>
      </div>
    </motion.nav>
  );
}
