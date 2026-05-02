import Link from "next/link";
import { Sparkles, ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-cream py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-navy/60 hover:text-brand-purple mb-10 transition-colors font-bold">
          <ChevronLeft size={20} /> Înapoi la Magie
        </Link>

        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border-8 border-brand-blue/10">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-brand-blue w-8 h-8" />
            <h1 className="font-nunito font-black text-4xl text-brand-navy">Politica de Confidențialitate</h1>
          </div>

          <div className="prose prose-brand max-w-none text-brand-navy/80 space-y-8 font-medium">
            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Protejăm Datele Micuților</h2>
              <p>La Povestea Mea Magică, siguranța și confidențialitatea datelor tale și ale copilului tău sunt prioritatea noastră numărul unu. Nu vindem și nu partajăm datele tale cu terțe părți în scopuri de marketing.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Ce Date Colectăm?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datele de personalizare:</strong> Numele și vârsta copilului (folosite exclusiv pentru a genera povestea).</li>
                <li><strong>Datele de contact:</strong> Adresa ta de email (pentru livrarea poveștii și comunicări despre comandă).</li>
                <li><strong>Datele de plată:</strong> Procesate direct de Stripe. Noi nu avem acces la datele cardului tău.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cum Folosim Datele?</h2>
              <p>Datele sunt folosite strict pentru a crea produsul comandat și pentru a-l livra pe email. Numele copilului rămâne stocat doar în baza de date securizată pentru a-ți permite să re-descarci povestea dacă ai nevoie.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Drepturile Tale (GDPR)</h2>
              <p>Conform GDPR, ai dreptul de a solicita ștergerea datelor tale din sistemul nostru oricând. Trimite-ne un email la privacy@povesteamagica.ro și ne vom ocupa imediat.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cookie-uri</h2>
              <p>Folosim cookie-uri esențiale pentru a asigura buna funcționare a site-ului și a coșului de cumpărături. Nimic invaziv, doar magie tehnică!</p>
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
