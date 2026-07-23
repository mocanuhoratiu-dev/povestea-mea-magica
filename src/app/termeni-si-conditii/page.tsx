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
              <p>
                Bun venit la Povestea Mea Magică! Site-ul oferă instrumente digitale pentru generarea de povești și kituri personalizate pentru copii. Prin folosirea lui, ești de acord cu termenii descriși mai jos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">2. Serviciul Nostru</h2>
              <p>
                Serviciul permite generarea de povești digitale, kituri anti-frică și truse de activități pe baza datelor introduse de utilizator, precum nume, vârstă, temă sau context. Un adult ar trebui să verifice conținutul înainte de a-l folosi cu un copil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">3. Plăți și Livrare</h2>
              <p>
                În versiunea curentă, plățile online nu sunt active. Fișierele generate pot fi descărcate local sau, când alegi această opțiune, trimise ca atașament la adresa de email introdusă. Fluxul comercial complet va fi activat separat.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">4. Drepturi de Autor</h2>
              <p>
                Textele și machetele generate sunt oferite pentru uz personal. Nu este permisă revânzarea sau redistribuirea lor ca produs comercial fără acord scris.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">5. Contact</h2>
              <p>Dacă ai întrebări sau ai întâmpinat o problemă cu o comandă, ne poți scrie oricând la <strong>contact@povesteamagica.ro</strong>.</p>
            </section>
          </div>

          <div className="mt-16 pt-10 border-t border-brand-navy/5 text-center">
            <p className="text-brand-navy/40 text-sm italic">Ultima actualizare: 23 Iulie 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
