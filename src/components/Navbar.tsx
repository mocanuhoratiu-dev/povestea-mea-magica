"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { siteCopy } from "@/lib/siteMode";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-[95%] max-w-6xl"
    >
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full px-6 py-3 flex items-center justify-between overflow-hidden">
        
        {/* Unified Logo Style */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-brand-navy p-2 rounded-xl transition-transform group-hover:rotate-12">
            <Sparkles className="text-brand-gold w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="font-nunito font-black text-lg md:text-xl tracking-tight text-brand-navy">
            Povestea Mea <span className="text-brand-purple">Magică</span>
          </span>
        </Link>

        {/* Central Clean Menu */}
        <div className="hidden lg:flex items-center gap-10">
          {[
            { label: "Povești", href: "/#creator" },
            { label: "Scut de noapte", href: "/#monster-away" },
            { label: "Trusa de urgență", href: "/#emergency-kit" },
            { label: "Modele", href: "/modele" },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="text-xs font-black text-brand-navy/60 uppercase tracking-[0.2em] hover:text-brand-purple transition-all relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-purple transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <Link
          href="/#alege-materialul"
          className="bg-brand-navy text-white px-5 md:px-8 py-2.5 md:py-3 rounded-full font-black text-sm md:text-base hover:bg-brand-purple transition-all shadow-lg active:scale-95"
        >
          {siteCopy.navCta}
        </Link>
      </div>
    </motion.nav>
  );
}
