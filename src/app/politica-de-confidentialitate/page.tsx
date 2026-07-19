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
                <li><strong>Conversațiile cu Lumi:</strong> Mesajele pe care alegi să le trimiți ghidului AI pentru a primi recomandări. Nu cerem date sensibile și nu păstrăm conversațiile într-un cont sau istoric de client.</li>
                <li><strong>Date tehnice:</strong> Informații standard necesare pentru funcționarea serviciilor web și AI.</li>
                <li><strong>Statistici agregate de utilizare:</strong> Număr de vizite, produs început/generat, rezultat AI sau fallback, număr de pagini/cuvinte și descărcări PDF. Nu trimitem în aceste statistici numele copilului, textul poveștii, dedicația, prompturile sau un identificator de client.</li>
                <li><strong>Date de plată:</strong> Nu colectăm date de plată în versiunea curentă.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cum Folosim Datele?</h2>
              <p>
                Datele introduse sunt trimise către serviciile AI configurate pentru a genera conținutul solicitat. Lumi folosește Vertex AI pentru a oferi recomandări conversaționale părinților; mesajele sunt procesate pentru răspunsul din sesiunea curentă și nu sunt salvate într-un profil sau istoric de client de către aplicație. Pentru coperta poveștii folosim Vertex AI; coperta este trimisă browserului doar pentru previzualizare și PDF, fără a fi păstrată într-o bibliotecă de imagini. Dacă serviciul principal este temporar indisponibil, putem folosi o ilustrație de rezervă bazată numai pe un prompt generic, fără numele copilului, vârsta sau detaliile introduse de tine. Fișierele sunt create și descărcate din browser; în versiunea curentă nu există cont de client sau bibliotecă de comenzi. Statisticile agregate ne ajută să vedem ce produse sunt folosite și dacă o generare sau descărcare are probleme, fără a construi profiluri despre copil sau familie.
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
