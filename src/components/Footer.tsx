"use client";

import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { legalOperator } from "@/lib/publicContact";

export default function Footer() {
  return (
    <footer className="bg-brand-navy px-6 pb-10 pt-20 text-brand-cream">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-brand-cream/15 pb-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
          <div>
            <Link href="/" className="flex w-fit items-center gap-3">
              <BrandMark className="h-11 w-11" tone="paper" />
              <span className="font-serif text-2xl leading-none">Povestea Mea <span className="text-brand-gold italic">Magică</span></span>
            </Link>
            <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-brand-cream/70">Povești ilustrate și ritualuri create cu grijă pentru copilul și momentele familiei tale.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Materiale</p>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/povestea-magica" className="transition-colors hover:text-brand-gold">Povestea Magică</Link></li>
              <li><Link href="/scutul-de-noapte" className="transition-colors hover:text-brand-gold">Scutul de Noapte</Link></li>
              <li><Link href="/trusa-de-rabdare" className="transition-colors hover:text-brand-gold">Trusa de Răbdare</Link></li>
              <li><Link href="/modele" className="transition-colors hover:text-brand-gold">Răsfoiește modelele</Link></li>
              <li><Link href="/preturi" className="transition-colors hover:text-brand-gold">Prețuri</Link></li>
              <li><Link href="/cum-functioneaza" className="transition-colors hover:text-brand-gold">Cum funcționează</Link></li>
              <li><Link href="/despre" className="transition-colors hover:text-brand-gold">Despre proiect</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-gold">Încredere</p>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-brand-cream/70">
              <li><Link href="/politica-de-confidentialitate" className="transition-colors hover:text-brand-gold">Confidențialitate</Link></li>
              <li><Link href="/termeni-si-conditii" className="transition-colors hover:text-brand-gold">Termeni și condiții</Link></li>
              <li><Link href="/politica-de-rambursare" className="transition-colors hover:text-brand-gold">Politică de rambursare</Link></li>
              <li><Link href="/livrare-digitala" className="transition-colors hover:text-brand-gold">Livrare digitală</Link></li>
              <li><Link href="/politica-cookie-uri" className="transition-colors hover:text-brand-gold">Cookie-uri</Link></li>
              <li><Link href="/intrebari-frecvente" className="transition-colors hover:text-brand-gold">Întrebări frecvente</Link></li>
              <li><Link href="/siguranta-ai" className="transition-colors hover:text-brand-gold">Siguranța datelor</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-brand-gold">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-8 text-sm font-medium text-brand-cream/65 md:flex-row md:items-center md:justify-between">
          <p>© 2026 {legalOperator.name} · CUI {legalOperator.cui}</p>
          <p>Materiale digitale pentru familii, create pentru momente de folosit împreună.</p>
        </div>
      </div>
    </footer>
  );
}
