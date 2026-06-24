import Link from "next/link";
import { Sparkles, ChevronLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-cream py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-navy/60 hover:text-brand-purple mb-10 transition-colors font-bold">
          <ChevronLeft size={20} /> Înapoi la Magie
        </Link>

        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border-8 border-brand-purple/10">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-brand-purple w-8 h-8" />
            <h1 className="font-nunito font-black text-4xl text-brand-navy">Termeni și Condiții</h1>
          </div>

          <div className="prose prose-brand max-w-none text-brand-navy/80 space-y-8 font-medium">
            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">1. Introducere</h2>
              <p>Bun venit la Povestea Mea Magică! Site-ul este în prezent disponibil ca demo interactiv. Prin folosirea lui, ești de acord cu termenii descriși mai jos.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">2. Serviciul Nostru</h2>
              <p>Demo-ul permite generarea de povești digitale, kituri anti-frică și truse de activități pe baza datelor introduse de utilizator, precum nume, vârstă, temă sau context. Un adult ar trebui să verifice conținutul înainte de a-l folosi cu un copil.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">3. Plăți și Livrare</h2>
              <p>Plățile online și livrarea automată pe email nu sunt active în modul demo. Fișierele generate pot fi descărcate local din browser, iar fluxul comercial complet va fi comunicat separat la lansare.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">4. Drepturi de Autor</h2>
              <p>Textele și machetele generate în demo sunt oferite pentru testare și uz personal. Nu este permisă revânzarea sau redistribuirea lor ca produs comercial fără acord scris.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">5. Contact</h2>
              <p>Dacă ai întrebări sau ai întâmpinat o problemă cu o comandă, ne poți scrie oricând la <strong>contact@povesteamagica.ro</strong>.</p>
            </section>
          </div>

          <div className="mt-16 pt-10 border-t border-brand-navy/5 text-center">
            <p className="text-brand-navy/40 text-sm italic">Ultima actualizare: 24 Iunie 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
