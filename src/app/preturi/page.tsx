import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TimerReset } from "lucide-react";
import CommercialPage from "@/components/CommercialPage";
import { commerce, siteCopy } from "@/lib/siteMode";

export const metadata: Metadata = {
  title: "Prețuri | Povestea Mea Magică",
  description: "Prețurile planificate pentru poveștile și materialele digitale personalizate Povestea Mea Magică.",
  alternates: { canonical: "/preturi" },
};

const offers = [
  { title: "Povestea de Seară", price: `Scurtă ${commerce.prices.storyShort} · Lungă ${commerce.prices.storyLong}`, description: "O aventură ilustrată, cu dedicație de la familie și text adaptat alegerilor voastre.", details: ["Scurtă: copertă, dedicație și 2 pagini de poveste", "Lungă: copertă, dedicație și 4 pagini de poveste", "Previzualizare, editare și PDF pentru descărcare"], href: "/#creator", cta: "Personalizează povestea", icon: BookOpen },
  { title: "Scutul de Noapte", price: commerce.prices.nightShield, description: "Un ritual simbolic pentru seară, construit în jurul unei frici și a lucrurilor care liniștesc copilul.", details: ["Certificat personalizat", "Ritual simplu, de repetat împreună", "Etichete pentru flacon"], href: "/#monster-away", cta: "Personalizează Scutul", icon: ShieldCheck },
  { title: "Trusa de Răbdare", price: commerce.prices.patienceKit, description: "Activități printabile pentru momentele de așteptare: drum, restaurant, doctor, aeroport sau acasă.", details: ["5 pagini de activități", "Misiuni adaptate contextului", "Diplomă de final"], href: "/#emergency-kit", cta: "Personalizează Trusa", icon: TimerReset },
];

export default function PricingPage() {
  return (
    <CommercialPage eyebrow="Prețuri transparente" title="Alegi materialul, vezi prețul, apoi începi." description="Acestea sunt prețurile planificate pentru lansarea comercială. În această etapă, accesul rămâne gratuit și nu există pas de plată.">
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl border-y border-brand-gold/45 bg-brand-gold/10 px-6 py-6 text-center">
          <p className="text-sm font-black text-brand-navy">{siteCopy.launchAccess}</p>
        </div>
        <div className="mx-auto mt-14 max-w-5xl divide-y divide-brand-navy/15 border-y border-brand-navy/15">
          {offers.map((offer) => {
            const Icon = offer.icon;
            return <article key={offer.title} className="grid gap-8 py-10 md:grid-cols-[.78fr_1.22fr] md:gap-14">
              <div><Icon className="text-brand-purple" size={29} /><h2 className="mt-5 font-serif text-3xl text-brand-navy">{offer.title}</h2><p className="mt-4 font-nunito text-2xl font-black text-brand-navy">{offer.price}</p></div>
              <div><p className="text-base font-medium leading-relaxed text-brand-navy/70">{offer.description}</p><ul className="mt-6 space-y-3 border-t border-brand-navy/12 pt-5 text-sm font-bold leading-relaxed text-brand-navy/75">{offer.details.map((detail) => <li key={detail} className="flex gap-3"><span className="text-brand-purple">✦</span>{detail}</li>)}</ul><Link href={offer.href} className="mt-7 inline-flex items-center gap-2 border-b border-brand-purple pb-1 text-sm font-black text-brand-purple transition-colors hover:border-brand-navy hover:text-brand-navy">{offer.cta}<ArrowRight size={16} /></Link></div>
            </article>;
          })}
        </div>
        <div className="mx-auto mt-12 max-w-5xl border border-brand-navy/15 bg-white px-7 py-8 md:flex md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-brand-purple">Pachet complet</p><p className="mt-2 font-serif text-3xl text-brand-navy">Povestea lungă, Scutul și Trusa: {commerce.prices.completeSet}</p></div><Link href="/modele" className="mt-5 inline-flex items-center gap-2 bg-brand-navy px-5 py-3 text-sm font-black text-brand-cream transition-colors hover:bg-brand-purple md:mt-0">Răsfoiește modelele <ArrowRight size={16} /></Link></div>
      </section>
    </CommercialPage>
  );
}
