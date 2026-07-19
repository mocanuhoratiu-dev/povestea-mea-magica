import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function AiSafetyPage() {
  return (
    <main className="min-h-screen bg-brand-cream py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-navy/60 hover:text-brand-purple mb-10 transition-colors font-bold">
          <ChevronLeft size={20} /> Înapoi la Magie
        </Link>

        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border-8 border-brand-purple/10">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-brand-purple w-8 h-8" />
            <h1 className="font-nunito font-black text-4xl text-brand-navy">Siguranță și Conținut AI</h1>
          </div>

          <div className="prose prose-brand max-w-none text-brand-navy/80 space-y-8 font-medium">
            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Cum folosim AI-ul</h2>
              <p>Povestea Mea Magică folosește servicii AI pentru a genera texte personalizate pornind de la nume, vârstă, temă, lecție și detalii introduse de adult.</p>
              <p>Lumi, păzitoarea Lanternei, este un ghid conversațional pentru părinți: recomandă un material și poate propune alegeri pentru formular, dar nu completează sau generează nimic fără acțiunea părintelui.</p>
              <p>AI-ul poate produce ocazional formulări imperfecte, de aceea materialele trebuie verificate de un adult înainte să fie citite sau folosite cu un copil.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Ce evităm</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>conținut violent, rușinos sau nepotrivit pentru copii;</li>
                <li>sfaturi medicale, psihologice sau terapeutice prezentate ca tratament;</li>
                <li>detalii personale sensibile care nu sunt necesare pentru poveste;</li>
                <li>conversații care se prezintă drept consiliere medicală, psihologică sau terapeutică;</li>
                <li>promisiuni că un kit simbolic rezolvă singur frici sau anxietăți puternice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Rolul adultului</h2>
              <p>Produsele sunt materiale creative și ritualuri de joacă. Dacă fricile copilului sunt intense, persistente sau afectează somnul pe termen lung, recomandăm discuția cu un specialist.</p>
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
