"use client";

import { Sparkles, Mail } from "lucide-react";
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
              Misiunea noastră este să aducem magia lecturii în viața fiecărui copil, transformându-l în protagonistul propriilor aventuri.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-10 h-10 rounded-full bg-brand-cream/10 flex items-center justify-center hover:bg-brand-purple transition-colors cursor-pointer">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-cream/10 flex items-center justify-center hover:bg-brand-purple transition-colors cursor-pointer">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Link-uri Utile</h4>
            <ul className="space-y-4 text-brand-cream/60">
              <li><Link href="/termeni-si-conditii" className="hover:text-brand-gold transition-colors">Termeni și Condiții</Link></li>
              <li><Link href="/politica-de-confidentialitate" className="hover:text-brand-gold transition-colors">Politică de Confidențialitate</Link></li>
              <li><Link href="mailto:contact@povesteamagica.ro" className="hover:text-brand-gold transition-colors">Contact</Link></li>
              <li><Link href="/" className="hover:text-brand-gold transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Newsletter</h4>
            <p className="text-sm text-brand-cream/60 mb-4">Abonează-te pentru noutăți și oferte magice.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@tău.ro"
                className="bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-4 py-2 outline-none focus:border-brand-purple transition-all w-full text-sm"
              />
              <button className="bg-brand-purple p-3 rounded-xl hover:bg-brand-purple-light transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-brand-cream/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-brand-cream/40">
          <p>© 2026 Povestea Mea Magică. Toate drepturile rezervate.</p>
          <div className="flex gap-6">
            <span>Produs cu ❤️ în România</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
