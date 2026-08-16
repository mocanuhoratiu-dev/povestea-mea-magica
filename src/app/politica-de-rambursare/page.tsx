import type { Metadata } from "next";
import Link from "next/link";
import CommercialPage from "@/components/CommercialPage";
import { legalOperator, supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Politica de Rambursare | Povestea Mea Magică",
  description: "Cum tratăm problemele de livrare acum și cum va funcționa politica de rambursare după activarea plăților.",
  alternates: { canonical: "/politica-de-rambursare" },
};

export default function RefundPolicyPage() {
  return <CommercialPage eyebrow="Politica de rambursare" title="Reguli clare pentru materialele digitale personalizate." description="Explicăm transparent ce se întâmplă după plată, la livrarea imediată și atunci când ceva nu ajunge corect.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15 text-base font-medium leading-relaxed text-brand-navy/70"><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Operator</h2><p><strong>{legalOperator.name}</strong>, CUI {legalOperator.cui}, este operatorul acestui serviciu digital.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Până la activarea plăților</h2><p>Momentan, materialele se creează fără cost. Dacă un material are o problemă tehnică, ne poți scrie pentru ajutor sau pentru a-l regenera.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">După activarea plăților</h2><p>Înainte de confirmarea comenzii vei vedea prețul final, modalitatea de livrare și condițiile aplicabile. Pentru un material digital personalizat livrat imediat, checkout-ul va cere acordul expres pentru începerea furnizării și confirmarea informării despre dreptul de retragere, în condițiile legislației aplicabile.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Probleme de livrare</h2><p>Indiferent de etapa produsului, dacă PDF-ul nu se descarcă, emailul nu ajunge sau materialul nu corespunde alegerilor tale, anunță-ne. Analizăm problema și încercăm mai întâi să o remediem prin refacere sau relivrare.</p></section></div><div className="mx-auto mt-10 flex max-w-5xl gap-5"><a href={supportMailto("Ajutor pentru un material - Povestea Mea Magică")} className="border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Cere ajutor</a><Link href="/livrare-digitala" className="border-b border-brand-navy/30 pb-1 text-sm font-black text-brand-navy/70">Vezi livrarea digitală</Link></div><p className="mx-auto mt-10 max-w-5xl text-sm font-semibold text-brand-navy/50">Ultima actualizare: 16 august 2026</p></section>
  </CommercialPage>;
}
