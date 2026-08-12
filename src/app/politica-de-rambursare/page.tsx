import type { Metadata } from "next";
import Link from "next/link";
import CommercialPage from "@/components/CommercialPage";
import { supportMailto } from "@/lib/publicContact";

export const metadata: Metadata = {
  title: "Politica de Rambursare | Povestea Mea Magică",
  description: "Cum tratăm problemele de livrare în beta și cum va funcționa politica de rambursare după activarea plăților.",
  alternates: { canonical: "/politica-de-rambursare" },
};

export default function RefundPolicyPage() {
  return <CommercialPage eyebrow="Politica de rambursare" title="În beta nu plătești. După checkout, vei ști exact ce ți se aplică." description="Vrem ca regulile comerciale să fie explicate înainte de plată, nu ascunse după descărcare.">
    <section className="px-6 py-16 md:py-20"><div className="mx-auto max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15 text-base font-medium leading-relaxed text-brand-navy/70"><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Acum</h2><p>Platforma este în beta gratuită. Nu există plată, comandă cu plată sau rambursare procesată prin site. Dacă un material are o problemă tehnică, ne poți scrie pentru ajutor sau pentru a-l regenera.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">La lansarea comercială</h2><p>Înainte de plată, vom afișa clar prețul final, identitatea comerciantului, modalitatea de livrare, facturarea și condițiile de retragere sau rambursare. Pentru conținut digital personalizat livrat imediat, regulile privind dreptul de retragere și acordul expres vor fi prezentate în checkout înainte ca plata să fie confirmată.</p></section><section className="grid gap-4 py-8 md:grid-cols-[.55fr_1.45fr]"><h2 className="font-serif text-3xl text-brand-navy">Probleme de livrare</h2><p>Indiferent de etapa produsului, dacă PDF-ul nu se descarcă, emailul nu ajunge sau conținutul nu corespunde alegerilor tale, anunță-ne. Analizăm problema și încercăm mai întâi să o remediem prin refacere sau relivrare.</p></section></div><div className="mx-auto mt-10 flex max-w-5xl gap-5"><a href={supportMailto("Ajutor pentru un material - Povestea Mea Magică")} className="border-b border-brand-purple pb-1 text-sm font-black text-brand-purple">Cere ajutor</a><Link href="/livrare-digitala" className="border-b border-brand-navy/30 pb-1 text-sm font-black text-brand-navy/70">Vezi livrarea digitală</Link></div><p className="mx-auto mt-10 max-w-5xl text-sm font-semibold text-brand-navy/50">Ultima actualizare: 12 august 2026</p></section>
  </CommercialPage>;
}
