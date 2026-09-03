import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import OrderConfirmationClient from "@/components/OrderConfirmationClient";

export const metadata: Metadata = {
  title: "Comandă confirmată | Povestea Mea Magică",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <CommercialPage eyebrow="Comanda ta" title="Mulțumim. Atelierul s-a aprins." description="Urmărește aici pregătirea materialului. Poți închide pagina oricând: livrarea continuă și primești linkul pe email.">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <OrderConfirmationClient />
          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">Înapoi la povești <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </CommercialPage>
  );
}
