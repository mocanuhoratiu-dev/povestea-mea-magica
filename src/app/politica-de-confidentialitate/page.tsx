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
              <p>
                La Povestea Mea Magică, siguranța și confidențialitatea datelor tale și ale copilului tău sunt prioritare. În versiunea curentă nu există conturi de utilizator, nu colectăm plăți online și nu păstrăm în aplicație poveștile sau PDF-urile create.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Ce Date Colectăm?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datele de personalizare:</strong> Numele, vârsta, tema, frica sau contextul introduse în formulare.</li>
                <li><strong>Conversațiile cu Lumi:</strong> Mesajele pe care alegi să le trimiți ghidului digital pentru a primi recomandări. Nu cerem date sensibile și nu păstrăm conversațiile într-un cont sau istoric de client.</li>
                <li><strong>Date tehnice:</strong> Informații standard necesare pentru funcționarea sigură și fiabilă a serviciului.</li>
                <li><strong>Statistici agregate de utilizare:</strong> Număr de vizite, produs început/generat, rezultat AI sau fallback, număr de pagini/cuvinte și descărcări PDF. Nu trimitem în aceste statistici numele copilului, textul poveștii, dedicația, prompturile sau un identificator de client.</li>
                <li><strong>Date de plată:</strong> Nu colectăm date de plată în versiunea curentă.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cum Folosim Datele?</h2>
              <p>
                Folosim modele lingvistice avansate (LLM-uri) și tehnologie proprie pentru a crea conținutul solicitat, a susține conversația cu Lumi și a genera ilustrațiile necesare materialelor. Sistemul este construit cu principiul minimizării datelor: folosim doar informațiile necesare pentru rezultatul cerut, iar conversațiile sunt procesate pentru sesiunea curentă, fără a fi transformate într-un profil sau istoric de client în aplicație.
              </p>
              <p>
                Aplicăm măsuri tehnice și organizatorice pentru siguranță, securitate și funcționare responsabilă. Datele de personalizare nu sunt folosite pentru publicitate și nu construim profiluri despre copil sau familie. Ilustrațiile și fișierele sunt pregătite pentru previzualizare și descărcare, fără o bibliotecă de imagini sau comenzi asociată unui cont. Dacă o componentă de generare este temporar indisponibilă, putem folosi o alternativă care respectă aceleași principii de minimizare a datelor. Statisticile agregate ne ajută să îmbunătățim produsul și să depistăm probleme de funcționare, fără a include numele copilului, textul poveștii, dedicația sau mesajele voastre.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Drepturile Tale (GDPR)</h2>
              <p>Conform GDPR, ai dreptul să soliciți informații, corectare sau ștergere pentru datele care ar putea fi procesate de noi. Ne poți contacta la privacy@povesteamagica.ro.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cookie-uri</h2>
              <p>Nu folosim cookie-uri de publicitate sau un identificator persistent pentru statisticile agregate. Browserul păstrează doar un marcaj temporar de sesiune, fără ID de client, pentru a nu număra aceeași vizită de mai multe ori. Dacă vom adăuga cookie-uri opționale, analytics la nivel de persoană, plăți sau conturi, politica și fluxul de consimțământ vor fi actualizate înainte de activare.</p>
            </section>
          </div>

          <div className="mt-16 pt-10 border-t border-brand-navy/5 text-center">
            <p className="text-brand-navy/40 text-sm italic">Ultima actualizare: 19 Iulie 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
