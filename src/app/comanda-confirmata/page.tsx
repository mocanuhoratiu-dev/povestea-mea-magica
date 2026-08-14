import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Comanda confirmata | Povestea Mea Magica",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <CommercialPage eyebrow="Comanda ta" title="Multumim pentru comanda." description="Plata a fost inregistrata. Vei primi un email de confirmare cand materialul personalizat este pregatit.">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl border-y border-brand-gold/45 bg-brand-gold/10 px-7 py-10 text-center">
          <CheckCircle2 className="mx-auto text-brand-purple" size={40} />
          <p className="mt-5 text-base font-bold leading-relaxed text-brand-navy/80">Pastreaza emailul de confirmare. Pentru orice intrebare despre comanda, ne poti scrie din pagina de contact.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">Inapoi la povesti <ArrowRight size={16} /></Link>
        </div>
      </section>
    </CommercialPage>
  );
}
