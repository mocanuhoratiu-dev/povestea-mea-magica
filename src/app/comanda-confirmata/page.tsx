import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";

export const metadata: Metadata = {
  title: "Comandă confirmată | Povestea Mea Magică",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <CommercialPage eyebrow="Comanda ta" title="Mulțumim pentru comandă." description="Plata a fost înregistrată. Vei primi un email când materialul personalizat este pregătit.">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl border-y border-brand-gold/45 bg-brand-gold/10 px-7 py-10 text-center">
          <CheckCircle2 className="mx-auto text-brand-purple" size={40} />
          <p className="mt-5 text-base font-bold leading-relaxed text-brand-navy/80">Păstrează emailul de confirmare. Pentru orice întrebare despre comandă, ne poți scrie din pagina de contact.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">Înapoi la povești <ArrowRight size={16} /></Link>
        </div>
      </section>
    </CommercialPage>
  );
}
