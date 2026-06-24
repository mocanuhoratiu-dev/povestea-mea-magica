"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-brand-cream pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Sparkles className="text-brand-gold w-6 h-6" />
              <span className="font-nunito font-bold text-2xl tracking-tight">
                Povestea Mea <span className="text-brand-purple-light">Magică</span>
              </span>
            </Link>
            <p className="text-brand-cream/60 max-w-sm mb-8 leading-relaxed">
              Un atelier digital pentru povești personalizate, kituri anti-frică și activități rapide pentru părinți ocupați.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Link-uri Utile</h4>
            <ul className="space-y-4 text-brand-cream/60">
              <li><Link href="/termeni-si-conditii" className="hover:text-brand-gold transition-colors">Termeni și Condiții</Link></li>
              <li><Link href="/politica-de-confidentialitate" className="hover:text-brand-gold transition-colors">Politică de Confidențialitate</Link></li>
              <li><Link href="mailto:contact@povesteamagica.ro" className="hover:text-brand-gold transition-colors">Contact</Link></li>
              <li><Link href="#creator" className="hover:text-brand-gold transition-colors">Atelierul de Povești</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Status Lansare</h4>
            <p className="text-sm text-brand-cream/60 mb-4">
              Site-ul este în modul demo. Comenzile plătite și livrarea automată vor fi activate separat.
            </p>
            <Link href="mailto:contact@povesteamagica.ro" className="inline-flex rounded-xl bg-brand-cream/10 px-4 py-3 text-sm font-bold hover:bg-brand-purple transition-colors">
              Scrie-ne
            </Link>
          </div>
        </div>

        <div className="pt-10 border-t border-brand-cream/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-brand-cream/40">
          <p>© 2026 Povestea Mea Magică. Toate drepturile rezervate.</p>
          <div className="flex gap-6">
            <span>Creat în România</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
