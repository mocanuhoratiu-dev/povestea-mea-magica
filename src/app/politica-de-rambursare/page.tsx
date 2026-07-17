import Link from "next/link";
import { ChevronLeft, ReceiptText } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-cream py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-navy/60 hover:text-brand-purple mb-10 transition-colors font-bold">
          <ChevronLeft size={20} /> Înapoi la Magie
        </Link>

        <div className="bg-white rounded-[3rem] shadow-xl p-10 md:p-16 border-8 border-brand-gold/20">
          <div className="flex items-center gap-3 mb-8">
            <ReceiptText className="text-brand-gold w-8 h-8" />
            <h1 className="font-nunito font-black text-4xl text-brand-navy">Politica de Rambursare</h1>
          </div>

          <div className="prose prose-brand max-w-none text-brand-navy/80 space-y-8 font-medium">
            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Versiunea curentă</h2>
              <p>În acest moment, plățile online nu sunt active. Materialele se generează și se descarcă direct din browser, fără procesare de plată prin site.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">După activarea plăților</h2>
              <p>Produsele digitale personalizate sunt create pe baza datelor introduse de utilizator. După generare și livrare, rambursarea poate fi limitată, deoarece materialul este personalizat pentru copilul indicat.</p>
              <p>Vom analiza manual situațiile în care există o eroare tehnică, PDF-ul nu poate fi descărcat sau conținutul livrat nu corespunde opțiunilor selectate.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-brand-navy mb-4">Contact</h2>
              <p>Pentru orice problemă cu o comandă viitoare, scrie-ne la <strong>contact@povesteamagica.ro</strong> cu numele comenzii și o descriere scurtă a situației.</p>
            </section>
          </div>

          <div className="mt-16 pt-10 border-t border-brand-navy/5 text-center">
            <p className="text-brand-navy/40 text-sm italic">Ultima actualizare: 17 Iulie 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
