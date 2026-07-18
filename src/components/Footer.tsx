"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { siteCopy } from "@/lib/siteMode";

export default function Footer() {
  return (
    <footer className="bg-brand-navy px-6 pb-10 pt-20 text-brand-cream">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-brand-cream/15 pb-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
          <div>
            <Link href="/" className="flex w-fit items-center gap-3">
              <BrandMark className="h-11 w-11" tone="paper" title="Povestea Mea Magică" />
              <span className="font-serif text-2xl leading-none">Povestea Mea <span className="text-brand-gold italic">Magică</span></span>
            </Link>
            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-brand-cream/70">Magie practică pentru serile liniștite, curajul de mâine și timpul care trece mai ușor.</p>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Materiale</h4>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/#creator" className="transition-colors hover:text-brand-gold">Povestea de Seară</Link></li>
              <li><Link href="/#monster-away" className="transition-colors hover:text-brand-gold">Scutul de Noapte</Link></li>
              <li><Link href="/#emergency-kit" className="transition-colors hover:text-brand-gold">Trusa de Răbdare</Link></li>
              <li><Link href="/modele" className="transition-colors hover:text-brand-gold">Modele PDF</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Încredere</h4>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/politica-de-confidentialitate" className="transition-colors hover:text-brand-gold">Confidențialitate</Link></li>
              <li><Link href="/termeni-si-conditii" className="transition-colors hover:text-brand-gold">Termeni și condiții</Link></li>
              <li><Link href="/politica-de-rambursare" className="transition-colors hover:text-brand-gold">Politică de rambursare</Link></li>
              <li><Link href="/siguranta-ai" className="transition-colors hover:text-brand-gold">Siguranța datelor</Link></li>
              <li><Link href="mailto:contact@povesteamagica.ro" className="transition-colors hover:text-brand-gold">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-8 text-sm font-medium text-brand-cream/45 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Povestea Mea Magică. Toate drepturile rezervate.</p>
          <p>{siteCopy.footerStatusText}</p>
        </div>
      </div>
    </footer>
  );
}
