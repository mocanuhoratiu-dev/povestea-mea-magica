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
              <p>Bun venit la Povestea Mea Magică! Prin utilizarea acestui site și achiziționarea poveștilor noastre personalizate, ești de acord cu termenii descriși mai jos. Ne dorim ca experiența ta să fie la fel de magică precum poveștile noastre.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">2. Serviciul Nostru</h2>
              <p>Oferim servicii de personalizare a poveștilor digitale (PDF) și audio (MP3). Poveștile sunt generate pe baza datelor introduse de utilizator (nume, vârstă, temă). Utilizatorul este responsabil pentru acuratețea datelor introduse.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">3. Plăți și Livrare</h2>
              <p>Plățile sunt procesate securizat prin Stripe. Livrarea produselor digitale se face instantaneu pe adresa de email furnizată. Deoarece produsele sunt digitale și personalizate, nu se pot returna după ce au fost generate și livrate.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">4. Drepturi de Autor</h2>
              <p>Povestea Mea Magică deține drepturile de proprietate intelectuală asupra textelor, ilustrațiilor și formatelor. Achiziția unei povești îți oferă dreptul de utilizare personală și necomercială.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">5. Contact</h2>
              <p>Dacă ai întrebări sau ai întâmpinat o problemă cu o comandă, ne poți scrie oricând la <strong>contact@povesteamagica.ro</strong>.</p>
            </section>
          </div>

          <div className="mt-16 pt-10 border-t border-brand-navy/5 text-center">
            <p className="text-brand-navy/40 text-sm italic">Ultima actualizare: 2 Mai 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
