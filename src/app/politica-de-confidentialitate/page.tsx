import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

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
              <p>La Povestea Mea Magică, siguranța și confidențialitatea datelor tale și ale copilului tău sunt prioritare. Site-ul rulează momentan ca demo, fără conturi de utilizator și fără plăți active.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Ce Date Colectăm?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datele de personalizare:</strong> Numele, vârsta, tema, frica sau contextul introduse în formulare.</li>
                <li><strong>Date tehnice:</strong> Informații standard necesare pentru funcționarea serviciilor web și AI.</li>
                <li><strong>Date de plată:</strong> Nu colectăm date de plată în modul demo.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cum Folosim Datele?</h2>
              <p>Datele introduse sunt trimise către serviciile AI configurate pentru a genera conținutul solicitat. În demo, fișierele sunt create și descărcate din browser; nu există cont de client sau bibliotecă de comenzi.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Drepturile Tale (GDPR)</h2>
              <p>Conform GDPR, ai dreptul să soliciți informații, corectare sau ștergere pentru datele care ar putea fi procesate de noi. Ne poți contacta la privacy@povesteamagica.ro.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cookie-uri</h2>
              <p>În prezent, site-ul nu include un coș de cumpărături activ. Dacă vom adăuga analytics, plăți sau cookie-uri opționale, politica va fi actualizată înainte de lansare.</p>
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
