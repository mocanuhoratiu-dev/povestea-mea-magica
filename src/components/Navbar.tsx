"use client";

import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import { siteCopy } from "@/lib/siteMode";

export default function Navbar() {
  const [isLumiOpen, setIsLumiOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Povestea de seară", href: "/#creator" },
    { label: "Scutul de noapte", href: "/#monster-away" },
    { label: "Trusa de răbdare", href: "/#emergency-kit" },
    { label: "Modele", href: "/modele" },
    { label: "Despre", href: "/despre" },
  ];

  useEffect(() => {
    const handleLumiState = (event: Event) => {
      setIsLumiOpen((event as CustomEvent<{ isOpen: boolean }>).detail.isOpen);
    };
    window.addEventListener("pmm:lumi-open-change", handleLumiState);
    return () => window.removeEventListener("pmm:lumi-open-change", handleLumiState);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed inset-x-0 top-0 z-[10000] md:hidden"
        aria-label="Navigare principală"
      >
        <div className={`flex h-16 items-center justify-between border-b border-brand-navy/10 px-4 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ${
          isLumiOpen ? "bg-brand-cream/50 shadow-[0_8px_24px_rgba(36,50,79,0.05)]" : "bg-brand-cream/95 shadow-[0_8px_24px_rgba(36,50,79,0.12)]"
        }`}>
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
            <BrandMark className="h-8 w-8" title="Povestea Mea Magică" />
            <span className="font-serif text-[15px] leading-none text-brand-navy">
              Povestea Mea <span className="text-brand-purple italic">Magică</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center text-brand-navy transition-colors hover:bg-brand-navy hover:text-brand-cream"
            aria-label={isMobileMenuOpen ? "Închide meniul" : "Deschide meniul"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={22} />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-b border-brand-navy/10 bg-brand-cream px-4 pb-4 pt-2 shadow-[0_16px_30px_rgba(36,50,79,0.12)]"
          >
            {navigationItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-12 items-center border-b border-brand-navy/8 py-3 text-sm font-black text-brand-navy last:border-b-0">
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </motion.nav>

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed left-1/2 top-4 z-[10000] hidden w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 md:block"
        aria-label="Navigare principală"
      >
        <div className={`flex items-center justify-between border border-brand-navy/10 px-6 py-3 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ${
          isLumiOpen ? "bg-brand-cream/50 shadow-[0_12px_35px_rgba(36,50,79,0.07)]" : "bg-brand-cream/95 shadow-[0_12px_35px_rgba(36,50,79,0.14)]"
        }`}>
          <Link href="/" className="group flex items-center gap-3">
            <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" title="Povestea Mea Magică" />
            <span className="font-serif text-lg leading-none text-brand-navy">
              Povestea Mea <span className="text-brand-purple italic">Magică</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
          {navigationItems.map((item) => (
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
    </>
  );
}
